package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/golang/glog"
	"k8s.io/kubernetes/pkg/api"
	apierrors "k8s.io/kubernetes/pkg/api/errors"
	apiv1 "k8s.io/kubernetes/pkg/api/v1"
	"k8s.io/kubernetes/pkg/api/validation"
	"k8s.io/kubernetes/pkg/client/cache"
	unversionedcore "k8s.io/kubernetes/pkg/client/clientset_generated/internalclientset/typed/core/unversioned"
	clientset "k8s.io/kubernetes/pkg/client/clientset_generated/release_1_3"
	"k8s.io/kubernetes/pkg/client/record"
	"k8s.io/kubernetes/pkg/controller/framework"
	cmdutil "k8s.io/kubernetes/pkg/kubectl/cmd/util"
	"k8s.io/kubernetes/pkg/runtime"
	"k8s.io/kubernetes/pkg/util/wait"
	"k8s.io/kubernetes/pkg/watch"

	"github.com/coreos-inc/tectonic/manager/pkg/license"
)

var pollInterval = 5 * time.Second

// TectonicController is a Kubernetes controller which orchestrates
// Tectonic installations, and provides information about state of Tectonic
type TectonicController struct {
	client              clientset.Interface
	cmdfactory          *cmdutil.Factory
	schema              validation.Schema
	secretController    *framework.Controller
	configMapController *framework.Controller
	secretStore         cache.Store
	configMapStore      cache.Store
	// requiredSecrets and requiredConfigMaps are lists of Kubernetes resources
	// which must exist before the Tectonic Controller will proceed with the
	// postConfig manifests deployment
	requiredSecrets    []string
	requiredConfigMaps []string

	namespace string

	componentHealthWatcher *componentHealthWatcher
	recorder               record.EventRecorder

	// stopLock is used to enforce only a single call to Stop is active.
	// Needed because we allow stopping through an http endpoint and
	// allowing concurrent stoppers leads to stack traces.
	stopLock sync.Mutex
	stopChan chan struct{}
	shutdown bool
}

func NewTectonicController(clientset clientset.Interface, cmdfactory *cmdutil.Factory, schema validation.Schema, namespace string, resyncPeriod time.Duration, secrets, configMaps []string) (*TectonicController, error) {
	// Temporarily need to use an unversioned client for the eventsink because
	// not everything supports clientset yet
	rclient := clientset.Core().GetRESTClient()
	unversionedcoreclientset := unversionedcore.New(rclient)

	eventBroadcaster := record.NewBroadcaster()
	eventBroadcaster.StartLogging(glog.Infof)
	// TODO: remove the wrapper when every clients have moved to use the clientset.
	eventBroadcaster.StartRecordingToSink(&unversionedcore.EventSinkImpl{Interface: unversionedcoreclientset.Events("")})
	recorder := eventBroadcaster.NewRecorder(api.EventSource{Component: "tectonic-controller"})

	httpClient := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		},
		Timeout: time.Duration(5) * time.Second,
	}

	componentWatcher := newComponentHealthWatcher("NotStarted", httpClient)

	tsc := &TectonicController{
		client:                 clientset,
		cmdfactory:             cmdfactory,
		schema:                 schema,
		requiredSecrets:        secrets,
		requiredConfigMaps:     configMaps,
		namespace:              namespace,
		recorder:               recorder,
		stopChan:               make(chan struct{}),
		componentHealthWatcher: componentWatcher,
	}

	// We currently don't need to actually react to events, instead we poll
	// the local cache
	secretEventHandler := framework.ResourceEventHandlerFuncs{}
	tsc.secretStore, tsc.secretController = framework.NewInformer(
		&cache.ListWatch{
			ListFunc: func(options api.ListOptions) (runtime.Object, error) {
				return clientset.Core().Secrets(namespace).List(options)
			},
			WatchFunc: func(options api.ListOptions) (watch.Interface, error) {
				return clientset.Core().Secrets(namespace).Watch(options)
			},
		},
		&apiv1.Secret{}, resyncPeriod, secretEventHandler,
	)

	configMapEventHandler := framework.ResourceEventHandlerFuncs{}
	tsc.configMapStore, tsc.configMapController = framework.NewInformer(
		&cache.ListWatch{
			ListFunc: func(options api.ListOptions) (runtime.Object, error) {
				return clientset.Core().ConfigMaps(namespace).List(options)
			},
			WatchFunc: func(options api.ListOptions) (watch.Interface, error) {
				return clientset.Core().ConfigMaps(namespace).Watch(options)
			},
		},
		&apiv1.ConfigMap{}, resyncPeriod, configMapEventHandler,
	)

	return tsc, nil
}

func (tc *TectonicController) Run() {
	go tc.secretController.Run(tc.stopChan)
	go tc.configMapController.Run(tc.stopChan)
	go tc.componentHealthWatcher.Watch(tc.stopChan)
	go tc.install()
	<-tc.stopChan
}

func (tc *TectonicController) Stop() error {
	tc.stopLock.Lock()
	defer tc.stopLock.Unlock()

	if !tc.shutdown {
		tc.shutdown = true
		close(tc.stopChan)
		return nil
	}
	return fmt.Errorf("shutdown already in progress")
}

func (tc *TectonicController) install() {
	logger.Printf("starting Tectonic installation process")
	err := tc.installTectonic()
	if err != nil {
		logger.Printf("an error occurred while attempting to install tectonic: %v", err)
		tc.componentHealthWatcher.updateStatus("Failed")
	}
}

func (tc *TectonicController) installTectonic() error {
	// Before we do anything, make sure we're not in a state where some things
	// are running, and some are not running. this could lead to mixed versions
	// which we don't want to try to handle
	var resources []string
	// gotResources returns true when clusterHasExistingResources returns a
	// non-nil error, otherwise return false and err
	gotResources := func() (bool, error) {
		var err error
		resources, err = tc.clusterHasExistingResources()
		if err != nil {
			logger.Printf("encountered an error while checking if cluster has existing resources: %v", err)
			return false, nil
		}
		return true, nil
	}

	err := wait.PollInfinite(pollInterval, gotResources)
	if err != nil {
		return err
	}

	if len(resources) != 0 {
		logger.Printf("found the following Tectonic resources already in the cluster: %s", strings.Join(resources, ", "))
		return fmt.Errorf("found existing Tectonic resources in cluster, when expected none, not proceeding.")
	} else {
		logger.Printf("no existing Tectonic resources found, proceeding with installation")
	}

	logger.Println("creating Tectonic Wizard for setup and installation")
	err = installWiz(tc.cmdfactory, tc.schema, cfg)
	if err != nil {
		return fmt.Errorf("unable to install tectonic-wizard: %s", err)
	}
	logger.Println("successfully created Tectonic Wizard")

	logger.Println("waiting for configuration secrets and configMaps to be created")
	err = wait.PollInfinite(pollInterval, tc.ComponentsConfigReady)
	if err != nil {
		return fmt.Errorf("error occurred while waiting for component configuration secrets/configMaps", err)
	}
	logger.Println("configuration secrets and configMaps ready...")
	tc.componentHealthWatcher.updateStatus("InProgress")

	logger.Println("retrieving license from Kubernetes")
	var licenseReader io.Reader
	gotLicense := func() (bool, error) {
		var err error
		licenseReader, err = tc.retrieveLicense()
		if err != nil {
			// We expect all our configs/secrets to exist already, so if we got
			// not found, we just propagate it up
			if apierrors.IsNotFound(err) {
				return false, err
			}
			logger.Printf("unable to retrieve license: %v", err)
			return false, nil
		}
		return true, nil
	}
	err = wait.PollInfinite(pollInterval, gotLicense)
	if err != nil {
		return fmt.Errorf("error occurred while getting license", err)
	}
	logger.Println("successfully retrieved license")

	logger.Printf("verifying license")
	publicKey := strings.NewReader(license.PublicKeyPEM)
	licenseDetails, err := license.Verify(publicKey, licenseReader)
	if err != nil {
		return fmt.Errorf("unable to verify license: %v", err)
	}
	logger.Printf("successfully verified license")
	logger.Printf("license version: %s", licenseDetails.Version)
	logger.Printf("accountID: %s", licenseDetails.AccountID)

	logger.Println("retrieving Tectonic configuration")
	var tectonicConfig *tectonicConfig
	gotTectonicConfig := func() (bool, error) {
		var err error
		// We expect all our configs/secrets to exist already, so if we got not
		// found, we just propagate it up
		tectonicConfig, err = tc.retrieveTectonicConfig()
		if err != nil {
			if apierrors.IsNotFound(err) {
				return false, err
			}
			return false, fmt.Errorf("unable to retrieve Tectonic configuration: %v", err)
		}
		return true, nil
	}
	err = wait.PollInfinite(pollInterval, gotTectonicConfig)
	if err != nil {
		return err
	}
	logger.Println("successfully retrieved Tectonic configuration")

	logger.Println("setting up database")
	err = setupDatabase(tc.cmdfactory, tc.schema, cfg, tectonicConfig)
	if err != nil {
		return fmt.Errorf("unable to set up database configuration: %v", err)
	}
	logger.Println("completed database setup")

	logger.Println("installing Tectonic components...")
	err = installTectonic(tc.cmdfactory, tc.schema, cfg, licenseDetails)
	if err != nil {
		return fmt.Errorf("failed to install Tectonic components: %v", err)
	}
	logger.Println("successfully installed Tectonic")
	return nil
}

// clusterHasExistingResources returns a list of resources that exist
// in the cluster that it is expecting to create during installation, and any
// errors
func (tc *TectonicController) clusterHasExistingResources() ([]string, error) {
	var resourcesFound []string
	for _, dir := range allComponentDirs {
		manifestDir := filepath.Join(cfg.ManifestDir, dir)

		logger.Printf("checking to see if resources from %s already exist", manifestDir)
		infos, err := kubectlGetInfosFromFile(tc.cmdfactory, tc.schema, manifestDir)
		if err != nil {
			return nil, err
		}
		for _, info := range infos {
			// we expect a clean slate of things we're going to be creating, so
			// nothing should exist yet. not-found is an expected error.
			if err := info.Get(); apierrors.IsNotFound(err) {
				continue
			} else if info.Object != nil {
				resourcesFound = append(resourcesFound, fmt.Sprintf("%s/%s", info.Mapping.Resource, info.Name))
			} else {
				// unexpected error
				return nil, err
			}
		}
	}
	return resourcesFound, nil
}

func (tc *TectonicController) retrieveLicense() (io.Reader, error) {
	secret, err := tc.client.Core().Secrets(tc.namespace).Get("tectonic-license")
	if err != nil {
		return nil, err
	}
	return bytes.NewBuffer(secret.Data["license"]), nil
}

type tectonicConfig struct {
	deployPostgres bool
	identityDBURL  string
}

func (tc *TectonicController) retrieveTectonicConfig() (*tectonicConfig, error) {
	cm, err := tc.client.Core().ConfigMaps(tc.namespace).Get("tectonic-config")
	if err != nil {
		return nil, err
	}
	deployPostgres, err := strconv.ParseBool(cm.Data["deploy-postgres"])
	if err != nil {
		return nil, err
	}

	identityConfigSecret, err := tc.client.Core().Secrets(tc.namespace).Get("tectonic-identity-config-secret")
	if err != nil {
		return nil, err
	}

	identityDBURL, _ := identityConfigSecret.Data["identity-db-url"]
	return &tectonicConfig{
		deployPostgres: deployPostgres,
		identityDBURL:  string(identityDBURL),
	}, nil
}

func (tc *TectonicController) ComponentsConfigReady() (bool, error) {
	for _, secret := range tc.requiredSecrets {
		fullSecret := path.Join(tc.namespace, secret)
		_, exists, err := tc.secretStore.GetByKey(fullSecret)
		if err != nil {
			return false, err
		}
		if !exists {
			return false, nil
		}
	}
	for _, configMap := range tc.requiredConfigMaps {
		fullConfigMap := path.Join(tc.namespace, configMap)
		_, exists, err := tc.configMapStore.GetByKey(fullConfigMap)
		if err != nil {
			return false, err
		}
		if !exists {
			return false, nil
		}
	}

	return true, nil
}

type componentHealthWatcher struct {
	status     string
	statusLock sync.Mutex
	httpClient *http.Client
}

func newComponentHealthWatcher(initialStatus string, client *http.Client) *componentHealthWatcher {
	if client == nil {
		client = http.DefaultClient
	}
	return &componentHealthWatcher{
		status:     initialStatus,
		httpClient: client,
	}
}

func (watcher *componentHealthWatcher) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	// Encode calls WriteHeader for us
	if err := json.NewEncoder(w).Encode(struct {
		Status string `json:"status"`
	}{
		Status: watcher.getStatus(),
	}); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func (watcher *componentHealthWatcher) Watch(stopChan chan struct{}) {
	logger.Println("starting component health watcher")
	ticker := time.NewTicker(10 * time.Second)
	componentEps := []string{
		"https://tectonic-identity-worker:5556/health",
		"http://tectonic-id-overlord:5557/health",
		"https://tectonic-console:80/health",
	}
	healthyCount := 0
	numComponents := len(componentEps)
	for {
		select {
		case <-stopChan:
			logger.Println("got stop signal, stopping component health watcher")
			return
		case <-ticker.C:
			newHealthyCount := watcher.checkComponentsHealth(componentEps)
			// keep track of old and new count, updating the count if it
			// changes. prevents logging the same line over and over again
			if newHealthyCount != healthyCount {
				healthyCount = newHealthyCount
				logger.Printf("%d/%d components were healthy", healthyCount, numComponents)
			}
			if healthyCount == numComponents {
				watcher.updateStatus("Success")
			}
		}
	}
}

// checkComponentsHealth runs multiple go routines to perform health checks
// against a list of endpoints and waits for the results to come back before
// returning the number of components which were healthy
func (watcher *componentHealthWatcher) checkComponentsHealth(components []string) int {
	healthChans := make(map[string]chan bool)
	for _, url := range components {
		healthChans[url] = make(chan bool)
	}

	for url, healthChan := range healthChans {
		// Pass arguments as to function because range variables get reused
		// each iteration, causing problems with Go routines referring to
		// variables in a range clause
		go func(url string, healthChan chan bool) {
			// logger.Printf("checking endpoint %s health\n", url)
			healthChan <- httpGet(watcher.httpClient, url)
		}(url, healthChan)
	}

	healthyCount := 0
	for _, healthChan := range healthChans {
		if <-healthChan {
			healthyCount++
		}
	}

	return healthyCount
}

func (watcher *componentHealthWatcher) updateStatus(status string) {
	watcher.statusLock.Lock()
	defer watcher.statusLock.Unlock()
	if watcher.status != status {
		logger.Printf("updating deployment status from %s to %s", watcher.status, status)
		watcher.status = status
	}
}

func (watcher *componentHealthWatcher) getStatus() string {
	watcher.statusLock.Lock()
	defer watcher.statusLock.Unlock()
	if watcher.status == "" {
		return "InProgress" // TODO: maybe something else? Unknown perhaps?
	}
	return watcher.status
}

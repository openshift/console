package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"path/filepath"

	"github.com/pborman/uuid"
	"k8s.io/kubernetes/pkg/api"
	apierrors "k8s.io/kubernetes/pkg/api/errors"
	"k8s.io/kubernetes/pkg/api/meta"
	apiv1 "k8s.io/kubernetes/pkg/api/v1"
	"k8s.io/kubernetes/pkg/api/validation"
	cmdutil "k8s.io/kubernetes/pkg/kubectl/cmd/util"
	"k8s.io/kubernetes/pkg/labels"
	"k8s.io/kubernetes/pkg/util/strategicpatch"

	"github.com/coreos-inc/tectonic/manager/pkg/license"
)

const (
	wizManifestDirName        = "wiz"
	coreManifestDirName       = "core"
	monitoringManifestDirName = "monitoring"
)

var (
	allComponentDirs = []string{
		wizManifestDirName,
		coreManifestDirName,
		monitoringManifestDirName,
	}

	postWizComponentDirs = []string{
		coreManifestDirName,
		monitoringManifestDirName,
	}

	tectonicPostgresNodeLabels = map[string]string{
		"tectonic-postgres": "true",
	}
	tectonicPostgresLabelSet     = labels.Set(tectonicPostgresNodeLabels)
	tectonicPostgresNodeSelector = labels.SelectorFromSet(tectonicPostgresLabelSet)
)

func installWiz(f *cmdutil.Factory, schema validation.Schema, cfg Config) error {
	wizManifestDir := filepath.Join(cfg.ManifestDir, wizManifestDirName)
	logger.Println("creating resources from ", wizManifestDir)
	return kubectlCreateFromFile(f, schema, wizManifestDir)
}

func installTectonic(f *cmdutil.Factory, schema validation.Schema, cfg Config, licenseDetails *license.LicenseDetails) error {
	logger.Println("creating tectonic-support secret")

	secretName := "tectonic-support"
	exists, err := checkSecretExists(secretName)
	if err != nil {
		return fmt.Errorf("unable to check if secret %s exists: %s", secretName, err)
	}
	if exists {
		logger.Printf("secret %s already exists, not creating", secretName)
	} else {
		logger.Printf("secret %s does not exist, attempting to create it", secretName)
		err = createSecret(secretName, map[string][]byte{
			"account-id":     []byte(licenseDetails.AccountID),
			"account-secret": []byte(licenseDetails.AccountSecret),
			"cluster-id":     []byte(uuid.New()),
		}, statefulLabel)
		if err != nil {
			return err
		}
	}

	secretName = "tectonic-identity-access-secret"
	exists, err = checkSecretExists(secretName)
	if err != nil {
		return fmt.Errorf("unable to check if secret %s exists: %s", secretName, err)
	}
	if exists {
		logger.Printf("secret %s already exists, not creating", secretName)
	} else {
		logger.Printf("secret %s does not exist, attempting to create it", secretName)

		keySecret, err := newKeySecret()
		if err != nil {
			return err
		}
		adminSecret, err := newAdminKeySecret()
		if err != nil {
			return err
		}

		// dex expects these values in base64 encoded form,
		// we are **not** encoding them because they're a secret, the bindings
		// will do that for us
		err = createSecret(secretName, map[string][]byte{
			"identity-key-secrets":      []byte(base64.StdEncoding.EncodeToString(keySecret)),
			"identity-admin-api-secret": []byte(base64.StdEncoding.EncodeToString(adminSecret)),
		}, statefulLabel)
		if err != nil {
			return err
		}
	}

	// Deploy core tectonic components and monitoring
	for _, dir := range postWizComponentDirs {
		manifestDir := filepath.Join(cfg.ManifestDir, dir)
		logger.Println("creating resources from ", manifestDir)
		err = kubectlCreateFromFile(f, schema, manifestDir)
		if err != nil {
			return err
		}
	}

	return nil
}

func installPostgres(f *cmdutil.Factory, schema validation.Schema, cfg Config) error {
	kclient, err := newKubeClientSet()
	if err != nil {
		return err
	}
	nodeList, err := kclient.Core().Nodes().List(api.ListOptions{
		LabelSelector: tectonicPostgresNodeSelector,
	})
	if err != nil {
		return err
	}

	switch len(nodeList.Items) {
	case 0:
		logger.Printf("found zero nodes with tectonic-postgres label, picking random available node to label for Postgres")
		nodeList, err = kclient.Core().Nodes().List(api.ListOptions{})
		if err != nil {
			return err
		}

		var nodeToLabel *apiv1.Node
		for _, node := range nodeList.Items {
			if node.Spec.Unschedulable {
				continue
			}
			for _, condition := range node.Status.Conditions {
				if condition.Type == apiv1.NodeReady && condition.Status == apiv1.ConditionTrue {
					nodeToLabel = &node
				}
			}
			break
		}

		if nodeToLabel == nil {
			return fmt.Errorf("zero nodes available to label as tectonic-postgres node")
		}

		// used when creating a merge patch
		oldData, err := json.Marshal(nodeToLabel)
		if err != nil {
			return err
		}

		accessor, err := meta.Accessor(nodeToLabel)
		if err != nil {
			return err
		}

		// Merge the labels it already has with what we're adding
		objLabels := accessor.GetLabels()
		if objLabels == nil {
			objLabels = make(map[string]string)
		}
		for key, value := range tectonicPostgresNodeLabels {
			objLabels[key] = value
		}
		accessor.SetLabels(objLabels)

		newData, err := json.Marshal(nodeToLabel)
		if err != nil {
			return err
		}

		patchBytes, err := strategicpatch.CreateTwoWayMergePatch(oldData, newData, nodeToLabel)
		if err != nil {
			return err
		}
		nodeName := accessor.GetName()

		logger.Printf("labeling %s with %s", nodeName, tectonicPostgresLabelSet.String())
		// TODO(chance): replace the rest client operations with the clientset
		// wrapper when Patch() is added to clientsets in 1.4
		// _, err = kclient.Core().Nodes().Patch(nodeName, api.StrategicMergePatchType, patchBytes)
		var result = &apiv1.Node{}
		err = kclient.Core().GetRESTClient().
			Patch(api.StrategicMergePatchType).
			Resource("nodes").
			Name(nodeName).
			Body(patchBytes).
			Do().
			Into(result)
		if err != nil {
			return err
		}
		logger.Printf("successfully labeled %s with %s", nodeName, tectonicPostgresLabelSet.String())
	case 1:
		// 1 node in the list already has the label, so we can just deploy
		// Postgres
		logger.Printf("found existing node %s with label %s, using existing node for Postgres", nodeList.Items[0].ObjectMeta.Name, tectonicPostgresLabelSet.String())
	default:
		// more than a single node has the label, so we can't move forward,
		// because we can't be sure Postgres will stay on that node.
		return fmt.Errorf("found more than one node with label %s, unable to install Postgres", tectonicPostgresLabelSet.String())
	}

	postgresManifestDir := filepath.Join(cfg.ManifestDir, "postgres")
	logger.Println("creating resources from ", postgresManifestDir)
	return kubectlCreateFromFile(f, schema, postgresManifestDir)
}

func setupDatabase(f *cmdutil.Factory, schema validation.Schema, cfg Config, tecCfg *tectonicConfig) error {
	var dbURL, dbUser, dbPassword, dbName string

	if tecCfg.deployPostgres {
		// First create a secret which has the postgres superuser creds, and
		// the default db name
		randBytes, err := randomBytes(32)
		if err != nil {
			return fmt.Errorf("unable to generate random password for db user %s: %s", dbUser, err)
		}
		// URL Encoding so we don't have '/' and no padding needed either.'
		postgresPass := base64.RawURLEncoding.EncodeToString(randBytes)

		secretName := "tectonic-postgres-db-secret"
		logger.Printf("checking if secret %s exists", secretName)
		exists, err := checkSecretExists(secretName)
		if err != nil {
			return fmt.Errorf("unable to check if secret %s exists: %s", secretName, err)
		}
		if exists {
			logger.Printf("secret %s already exists, not creating", secretName)
		} else {
			logger.Printf("attempting to create secret %s", secretName)
			err = createSecret(secretName, map[string][]byte{
				"postgres-user":     []byte("postgres"),
				"postgres-password": []byte(postgresPass),
				"postgres-db":       []byte("postgres"),
			}, statefulLabel)
			if err != nil {
				return fmt.Errorf("error occurred when attempting to create secret %s: %s", secretName, err)
			}
			logger.Printf("successfully created secret %s", secretName)
		}

		// Next we fill in the values we want to use to connect to our new
		// database
		dbUser = "tectonic_identity"
		randBytes, err = randomBytes(32)
		if err != nil {
			return fmt.Errorf("unable to generate random password for db user %s: %s", dbUser, err)
		}
		dbPassword = base64.RawURLEncoding.EncodeToString(randBytes)
		dbName = "tectonic_identity"
		dbURL = fmt.Sprintf("postgres://%s:%s@tectonic-postgres:5432/%s?sslmode=disable", dbUser, dbPassword, dbName)
	} else {
		dbURL = tecCfg.identityDBURL
	}

	// If we're deploying Postgres, all of these values will be filled in
	// otherwise only the identity-db-url will be non-empty. When we're
	// deploying Postgres these values are used when Postgres starts up to
	// create our database.
	secretName := "tectonic-identity-db-secret"
	logger.Printf("checking if secret %s exists", secretName)
	exists, err := checkSecretExists(secretName)
	if err != nil {
		return fmt.Errorf("unable to check if secret %s exists: %s", secretName, err)
	}
	if exists {
		logger.Printf("secret %s already exists, not creating", secretName)
	} else {
		logger.Printf("attempting to create secret %s", secretName)
		err = createSecret(secretName, map[string][]byte{
			"identity-db-user":     []byte(dbUser),
			"identity-db-password": []byte(dbPassword),
			"identity-db-name":     []byte(dbName),
			"identity-db-url":      []byte(dbURL),
		}, statefulLabel)
		if err != nil {
			return fmt.Errorf("error occurred when attempting to create secret %s: %s", secretName, err)
		}
		logger.Printf("successfully created secret %s", secretName)
	}

	logger.Printf("deploying Postres: %t", tecCfg.deployPostgres)
	if tecCfg.deployPostgres {
		logger.Printf("checking if tectonic-postgres deployment already exists")
		_, err := getDeployment("tectonic-postgres")
		if apierrors.IsNotFound(err) {
			logger.Printf("tectonic-postgres does not exist, installing Postgres")
			err = installPostgres(f, schema, cfg)
			if err != nil {
				return fmt.Errorf("error occurred while installing Postgres: %s", err)
			}
			logger.Printf("successfully installed Postgres")
		} else if err != nil {
			return fmt.Errorf("unable to get deployment: %s", err)
		} else {
			logger.Println("tectonic-postgres already exists, not attempting to redeploy Postgres")
		}
	}

	return nil
}

func newKeySecret() ([]byte, error) {
	return randomBytes(32)
}

func newAdminKeySecret() ([]byte, error) {
	return randomBytes(128)
}

func randomBytes(size int) ([]byte, error) {
	b := make([]byte, size)
	_, err := rand.Read(b)
	if err != nil {
		return nil, err
	}
	return b, nil
}

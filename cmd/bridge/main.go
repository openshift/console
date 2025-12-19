package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"flag"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"runtime"
	"time"

	"github.com/openshift/console/cmd/bridge/config"
	authopts "github.com/openshift/console/cmd/bridge/config/auth"
	"github.com/openshift/console/cmd/bridge/config/session"
	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/controllers"
	"github.com/openshift/console/pkg/flags"
	"github.com/openshift/console/pkg/knative"
	"github.com/openshift/console/pkg/olm"
	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/server"
	"github.com/openshift/console/pkg/serverconfig"
	oscrypto "github.com/openshift/library-go/pkg/crypto"
	"github.com/prometheus/client_golang/prometheus"
	ctrlmetrics "sigs.k8s.io/controller-runtime/pkg/metrics/server"

	"github.com/patrickmn/go-cache"
	kruntime "k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/rest"
	klog "k8s.io/klog/v2"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
)

func main() {
	// Initialize controller-runtime logger, needed for the OLM handler
	log.SetLogger(zap.New())

	fs := flag.NewFlagSet("bridge", flag.ExitOnError)
	klog.InitFlags(fs)
	defer klog.Flush()

	authOptions := authopts.NewAuthOptions()
	authOptions.AddFlags(fs)

	sessionOptions := session.NewSessionOptions()
	sessionOptions.AddFlags(fs)

	opts := config.NewOptions()
	opts.AddFlags(fs)

	if err := fs.Parse(os.Args[1:]); err != nil {
		klog.Fatalf("Failed to parse flags: %v", err)
	}

	configFile := fs.Lookup("config").Value.String()

	// Track registered metrics collectors for cleanup on restart
	var registeredCollectors []prometheus.Collector

	// Run server in a loop to support restarts
	for {
		// Unregister metrics collectors from previous iteration
		for _, collector := range registeredCollectors {
			prometheus.Unregister(collector)
		}
		registeredCollectors = nil

		// Create a new context for this iteration that can be cancelled to trigger shutdown
		ctx, cancel := context.WithCancel(context.Background())

		// Start config file watcher if a config file is specified
		if configFile != "" {
			watcher, err := serverconfig.NewConfigWatcher(configFile, func() {
				klog.Info("Config file changed, triggering server restart...")
				cancel()
			})
			if err != nil {
				klog.Fatalf("Failed to create config file watcher: %v", err)
			}

			go func() {
				if err := watcher.Start(ctx); err != nil && err != context.Canceled {
					klog.Errorf("Config file watcher stopped with error: %v", err)
				}
			}()
		}

		// Parse and apply config
		cfg, err := serverconfig.Parse(fs, os.Args[1:], "BRIDGE")
		if err != nil {
			klog.Fatalf("Failed to parse config: %v", err)
		}

		if err := serverconfig.Validate(fs); err != nil {
			klog.Fatalf("Invalid config: %v", err)
		}

		authOptions.ApplyConfig(&cfg.Auth)
		sessionOptions.ApplyConfig(&cfg.Session)

		completedOpts, err := opts.CompleteOptions()
		if err != nil {
			klog.Fatalf("options usage: %v", err)
		}

		completedAuthOpts, err := authOptions.Complete()
		if err != nil {
			klog.Fatalf("authentication options usage: %v", err)
		}

		completedSessionOpts, err := sessionOptions.Complete(completedAuthOpts.AuthType)
		if err != nil {
			klog.Fatalf("session options usage: %v", err)
		}

		server, k8sURL, err := createServer(completedOpts)
		if err != nil {
			klog.Fatalf("failed to create server: %v", err)
		}

		caCertFilePath := completedOpts.CAFile
		if completedOpts.K8sMode == "in-cluster" {
			caCertFilePath = config.K8sInClusterCA
		}
		if err := completedAuthOpts.ApplyTo(server, k8sURL, caCertFilePath, completedSessionOpts); err != nil {
			klog.Fatalf("failed to apply authentication options: %v", err)
		}

		// Controllers are behind Tech Preview flag
		if completedOpts.TechPreview {
			controllerManagerMetricsOptions := ctrlmetrics.Options{
				// Disable the metrics server for now. We can enable it later if we want and make it a configurable flag.
				BindAddress: "0",
			}
			mgr, err := ctrl.NewManager(server.InternalProxiedK8SClientConfig, ctrl.Options{
				Scheme:  kruntime.NewScheme(),
				Metrics: controllerManagerMetricsOptions,
			})
			if err != nil {
				klog.Errorf("problem creating main controller manager: %v", err)
			}

			cache := cache.New(config.DefaultCacheDuration, config.DefaultCacheCleanup)
			catalogService := olm.NewCatalogService(server.ServiceClient, server.CatalogdProxyConfig, cache)
			server.CatalogService = catalogService

			if err = controllers.NewClusterCatalogReconciler(mgr, catalogService).SetupWithManager(mgr); err != nil {
				klog.Errorf("failed to start ClusterCatalog reconciler: %v", err)
			}

			klog.Info("starting controller manager")
			go func() {
				// Controller manager will be stopped when signal context is cancelled
				if err := mgr.Start(ctx); err != nil {
					klog.Errorf("problem running manager: %v", err)
				}
			}()
		}

		handler, newPrometheusCollectors, err := server.HTTPHandler()
		if err != nil {
			klog.Fatalf("failed to create handler: %v", err)
		}
		registeredCollectors = newPrometheusCollectors

		// Store collectors for cleanup on next iteration
		shouldRestart := startServer(ctx, handler, completedOpts)
		if !shouldRestart {
			return
		}
	}
}

func createServer(opts *config.CompletedOptions) (*server.Server, *url.URL, error) {
	srv := &server.Server{
		PublicDir:                    opts.PublicDir,
		BaseURL:                      opts.BaseURL,
		Branding:                     opts.Branding,
		CustomProductName:            opts.CustomProductName,
		CustomLogoFiles:              opts.CustomLogos,
		CustomFaviconFiles:           opts.CustomFavicons,
		ControlPlaneTopology:         opts.ControlPlaneTopology,
		StatuspageID:                 opts.StatuspageID,
		DocumentationBaseURL:         opts.DocumentationBaseURL,
		AlertManagerUserWorkloadHost: opts.AlertmanagerUserWorkloadHost,
		AlertManagerTenancyHost:      opts.AlertmanagerTenancyHost,
		AlertManagerPublicURL:        opts.AlertmanagerPublicURL,
		GrafanaPublicURL:             opts.GrafanaPublicURL,
		PrometheusPublicURL:          opts.PrometheusPublicURL,
		ThanosPublicURL:              opts.K8sModeOffClusterThanos,
		LoadTestFactor:               opts.LoadTestFactor,
		DevCatalogCategories:         opts.DevCatalogCategories,
		DevCatalogTypes:              opts.DevCatalogTypes,
		UserSettingsLocation:         opts.UserSettingsLocation,
		EnabledPlugins:               opts.EnabledPlugins,
		EnabledPluginsOrder:          opts.PluginsOrder,
		I18nNamespaces:               opts.I18nNamespaces,
		PluginProxy:                  opts.PluginProxy,
		ContentSecurityPolicyEnabled: opts.ContentSecurityPolicyEnabled,
		ContentSecurityPolicy:        opts.ConsoleCSPs,
		QuickStarts:                  opts.QuickStarts,
		AddPage:                      opts.AddPage,
		ProjectAccessClusterRoles:    opts.ProjectAccessClusterRoles,
		Perspectives:                 opts.Perspectives,
		Telemetry:                    opts.Telemetry,
		ReleaseVersion:               opts.ReleaseVersion,
		NodeArchitectures:            opts.NodeArchitectures,
		NodeOperatingSystems:         opts.NodeOperatingSystems,
		K8sMode:                      opts.K8sMode,
		CopiedCSVsDisabled:           opts.CopiedCSVsDisabled,
		Capabilities:                 opts.Capabilities,
	}

	// if !in-cluster (dev) we should not pass these values to the frontend
	// is used by catalog-utils.ts
	if opts.K8sMode == "in-cluster" {
		srv.GOARCH = runtime.GOARCH
		srv.GOOS = runtime.GOOS
	}

	// Blacklisted headers
	srv.ProxyHeaderDenyList = []string{"Cookie", "X-CSRFToken"}

	var (
		// Hold on to raw certificates so we can render them in kubeconfig files.
		k8sCertPEM []byte
	)

	k8sURL := &url.URL{Scheme: "https", Host: "kubernetes.default.svc"}

	switch opts.K8sMode {
	case "in-cluster":
		var err error
		k8sCertPEM, err = os.ReadFile(config.K8sInClusterCA)
		if err != nil {
			klog.Fatalf("Error inferring Kubernetes config from environment: %v", err)
		}
		rootCAs := x509.NewCertPool()
		if !rootCAs.AppendCertsFromPEM(k8sCertPEM) {
			klog.Fatal("No CA found for the API server")
		}
		tlsConfig := oscrypto.SecureTLSConfig(&tls.Config{
			RootCAs: rootCAs,
		})

		srv.InternalProxiedK8SClientConfig = &rest.Config{
			Host:            k8sURL.String(),
			BearerTokenFile: config.K8sInClusterBearerToken,
			TLSClientConfig: rest.TLSClientConfig{
				CAFile: config.K8sInClusterCA,
			},
		}

		srv.K8sProxyConfig = &proxy.Config{
			TLSClientConfig: tlsConfig,
			HeaderBlacklist: srv.ProxyHeaderDenyList,
			Endpoint:        k8sURL,
		}

		// If running in an OpenShift cluster, set up a proxy to the prometheus-k8s service running in the openshift-monitoring namespace.
		if opts.ServiceCAFile != "" {
			serviceCertPEM, err := os.ReadFile(opts.ServiceCAFile)
			if err != nil {
				klog.Fatalf("failed to read service-ca.crt file: %v", err)
			}
			serviceProxyRootCAs := x509.NewCertPool()
			if !serviceProxyRootCAs.AppendCertsFromPEM(serviceCertPEM) {
				klog.Fatal("no CA found for Kubernetes services")
			}
			serviceProxyTLSConfig := oscrypto.SecureTLSConfig(&tls.Config{
				RootCAs: serviceProxyRootCAs,
			})

			srv.ServiceClient = &http.Client{
				Transport: &http.Transport{
					TLSClientConfig: serviceProxyTLSConfig,
				},
			}

			srv.CatalogdProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				Endpoint:        &url.URL{Scheme: "https", Host: config.CatalogdHost},
			}

			srv.ThanosProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        &url.URL{Scheme: "https", Host: config.OpenshiftThanosHost, Path: "/api"},
			}
			srv.ThanosTenancyProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        &url.URL{Scheme: "https", Host: config.OpenshiftThanosTenancyHost, Path: "/api"},
			}
			srv.ThanosTenancyProxyForRulesConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        &url.URL{Scheme: "https", Host: config.OpenshiftThanosTenancyForRulesHost, Path: "/api"},
			}

			srv.AlertManagerProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        &url.URL{Scheme: "https", Host: config.OpenshiftAlertManagerHost, Path: "/api"},
			}
			srv.AlertManagerUserWorkloadProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        &url.URL{Scheme: "https", Host: opts.AlertmanagerUserWorkloadHost, Path: "/api"},
			}
			srv.AlertManagerTenancyProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        &url.URL{Scheme: "https", Host: opts.AlertmanagerTenancyHost, Path: "/api"},
			}
			srv.TerminalProxyTLSConfig = serviceProxyTLSConfig
			srv.PluginsProxyTLSConfig = serviceProxyTLSConfig

			srv.GitOpsProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        &url.URL{Scheme: "https", Host: config.OpenshiftGitOpsHost},
			}
		}

	case "off-cluster":
		k8sURL = opts.K8sModeOffClusterEndpoint
		serviceProxyTLSConfig := oscrypto.SecureTLSConfig(&tls.Config{
			InsecureSkipVerify: opts.K8sModeOffClusterSkipVerifyTLS,
		})

		srv.ServiceClient = &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: serviceProxyTLSConfig,
			},
		}

		srv.InternalProxiedK8SClientConfig = &rest.Config{
			Host:      k8sURL.String(),
			Transport: &http.Transport{TLSClientConfig: serviceProxyTLSConfig},
		}

		if opts.K8sModeOffClusterServiceAccountBearerTokenFile != "" {
			srv.InternalProxiedK8SClientConfig.BearerTokenFile = opts.K8sModeOffClusterServiceAccountBearerTokenFile
		}

		srv.K8sProxyConfig = &proxy.Config{
			TLSClientConfig:         serviceProxyTLSConfig,
			HeaderBlacklist:         srv.ProxyHeaderDenyList,
			Endpoint:                k8sURL,
			UseProxyFromEnvironment: true,
		}

		if opts.K8sModeOffClusterCatalogd != nil && opts.K8sModeOffClusterCatalogd.String() != "" {
			srv.CatalogdProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				Endpoint:        opts.K8sModeOffClusterCatalogd,
			}
		}

		if opts.K8sModeOffClusterThanos != nil && opts.K8sModeOffClusterThanos.String() != "" {
			offClusterThanosURL := opts.K8sModeOffClusterThanos
			offClusterThanosURL.Path += "/api"
			srv.ThanosTenancyProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        offClusterThanosURL,
			}
			srv.ThanosTenancyProxyForRulesConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        offClusterThanosURL,
			}
			srv.ThanosProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        offClusterThanosURL,
			}
		}

		if opts.K8sModeOffClusterAlertmanager != nil && opts.K8sModeOffClusterAlertmanager.String() != "" {
			offClusterAlertManagerURL := opts.K8sModeOffClusterAlertmanager
			offClusterAlertManagerURL.Path += "/api"
			srv.AlertManagerProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        offClusterAlertManagerURL,
			}
			srv.AlertManagerTenancyProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        offClusterAlertManagerURL,
			}
			srv.AlertManagerUserWorkloadProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        offClusterAlertManagerURL,
			}
		}

		srv.TerminalProxyTLSConfig = serviceProxyTLSConfig
		srv.PluginsProxyTLSConfig = serviceProxyTLSConfig

		if opts.K8sModeOffClusterGitOps != nil {
			srv.GitOpsProxyConfig = &proxy.Config{
				TLSClientConfig: serviceProxyTLSConfig,
				HeaderBlacklist: srv.ProxyHeaderDenyList,
				Endpoint:        opts.K8sModeOffClusterGitOps,
			}
		}
	default:
		return nil, nil, flags.NewInvalidFlagError("k8s-mode", "must be one of: in-cluster, off-cluster")
	}

	apiServerEndpoint := opts.K8sPublicEndpoint
	if apiServerEndpoint == "" {
		apiServerEndpoint = srv.K8sProxyConfig.Endpoint.String()
	}
	srv.KubeAPIServerURL = apiServerEndpoint

	clusterManagementURL, err := url.Parse(config.ClusterManagementURL)
	if err != nil {
		return nil, nil, err
	}
	srv.ClusterManagementProxyConfig = &proxy.Config{
		TLSClientConfig: oscrypto.SecureTLSConfig(&tls.Config{}),
		HeaderBlacklist: srv.ProxyHeaderDenyList,
		Endpoint:        clusterManagementURL,
	}

	internalProxiedK8SRT, err := rest.TransportFor(srv.InternalProxiedK8SClientConfig)
	if err != nil {
		return nil, nil, err
	}
	srv.MonitoringDashboardConfigMapLister = server.NewResourceLister(
		&url.URL{
			Scheme: k8sURL.Scheme,
			Host:   k8sURL.Host,
			Path:   k8sURL.Path + "/api/v1/namespaces/openshift-config-managed/configmaps",
			RawQuery: url.Values{
				"labelSelector": {"console.openshift.io/dashboard=true"},
			}.Encode(),
		},
		internalProxiedK8SRT,
		nil,
	)

	srv.KnativeEventSourceCRDLister = server.NewResourceLister(
		&url.URL{
			Scheme: k8sURL.Scheme,
			Host:   k8sURL.Host,
			Path:   k8sURL.Path + "/apis/apiextensions.k8s.io/v1/customresourcedefinitions",
			RawQuery: url.Values{
				"labelSelector": {"duck.knative.dev/source=true"},
			}.Encode(),
		},
		internalProxiedK8SRT,
		knative.EventSourceFilter,
	)

	srv.KnativeChannelCRDLister = server.NewResourceLister(
		&url.URL{
			Scheme: k8sURL.Scheme,
			Host:   k8sURL.Host,
			Path:   k8sURL.Path + "/apis/apiextensions.k8s.io/v1/customresourcedefinitions",
			RawQuery: url.Values{
				"labelSelector": {"duck.knative.dev/addressable=true,messaging.knative.dev/subscribable=true"},
			}.Encode(),
		},
		internalProxiedK8SRT,
		knative.ChannelFilter,
	)

	srv.AnonymousInternalProxiedK8SRT, err = rest.TransportFor(rest.AnonymousClientConfig(srv.InternalProxiedK8SClientConfig))
	if err != nil {
		return nil, nil, err
	}

	srv.AuthMetrics = auth.NewMetrics(srv.AnonymousInternalProxiedK8SRT)

	tokenReviewer, err := auth.NewTokenReviewer(srv.InternalProxiedK8SClientConfig)
	if err != nil {
		return nil, nil, err
	}
	srv.TokenReviewer = tokenReviewer

	return srv, k8sURL, nil
}

func startServer(ctx context.Context, handler http.Handler, opts *config.CompletedOptions) bool {
	httpsrv := &http.Server{Handler: handler}
	listener, err := listen(opts.Listen, opts.TLSCertFile, opts.TLSKeyFile)
	if err != nil {
		klog.Fatalf("error getting listener, %v", err)
	}
	defer listener.Close()

	// Start shutdown handler
	go func() {
		<-ctx.Done()
		klog.Info("Shutting down server...")
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer shutdownCancel()
		if err := httpsrv.Shutdown(shutdownCtx); err != nil {
			klog.Errorf("Error shutting down server: %v", err)
		}
	}()

	if opts.RedirectPort != 0 {
		go func() {
			// Listen on passed port number to be redirected to the console
			redirectServer := http.NewServeMux()
			redirectServer.HandleFunc("/", func(res http.ResponseWriter, req *http.Request) {
				redirectURL := &url.URL{
					Scheme:   opts.BaseURL.Scheme,
					Host:     opts.BaseURL.Host,
					RawQuery: req.URL.RawQuery,
					Path:     req.URL.Path,
				}
				http.Redirect(res, req, redirectURL.String(), http.StatusMovedPermanently)
			})
			redirectPort := fmt.Sprintf(":%d", opts.RedirectPort)
			klog.Infof("Listening on %q for custom hostname redirect...", redirectPort)
			klog.Fatal(http.ListenAndServe(redirectPort, redirectServer))
		}()
	}

	klog.Infof("Server listening on %s", opts.Listen.String())
	serveErr := httpsrv.Serve(listener)

	// Determine if we should restart (context was not cancelled)
	if ctx.Err() == context.Canceled {
		// Context was cancelled (config change triggered restart)
		klog.Info("Restarting server with new configuration...")
		return true
	}
	// Server stopped with an error other than http.ErrServerClosed (something other than a graceful shutdown)
	if serveErr != nil && serveErr != http.ErrServerClosed {
		klog.Fatalf("Server stopped with error: %v", serveErr)
	}

	// Server should not restart, it was stopped gracefully
	klog.Info("Server stopped gracefully")
	return false
}

func listen(url *url.URL, certFile, keyFile string) (net.Listener, error) {
	klog.Infof("Binding to %s...", url.Host)
	if url.Scheme == "http" {
		klog.Info("Not using TLS")
		return net.Listen("tcp", url.Host)
	}
	klog.Info("Using TLS")
	tlsConfig := &tls.Config{
		NextProtos: []string{"http/1.1"},
		GetCertificate: func(_ *tls.ClientHelloInfo) (*tls.Certificate, error) {
			klog.V(4).Infof("Getting TLS certs.")
			cert, err := tls.LoadX509KeyPair(certFile, keyFile)
			if err != nil {
				return nil, err
			}
			return &cert, nil
		},
	}
	return tls.Listen("tcp", url.Host, tlsConfig)
}

// vl-tenancy-proxy sits between the console's plugin proxy and VictoriaLogs.
// It accepts the user's bearer token (the bridge forwards it for plugin proxy
// services with "authorize": true), checks with the API server which
// namespaces the user may read pod logs in, and adds that restriction to every
// query as a VictoriaLogs extra_stream_filters argument. Clients cannot remove
// or replace it.
package main

import (
	"flag"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"time"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

func main() {
	listen := flag.String("listen", ":8080", "address to serve on (plain HTTP)")
	upstream := flag.String("upstream", "", "VictoriaLogs base URL, e.g. http://victorialogs.logging.svc:9428 (required)")
	namespaceField := flag.String("namespace-field", "namespace", "VictoriaLogs stream field holding the pod's namespace")
	cacheTTL := flag.Duration("cache-ttl", 30*time.Second, "how long token and access reviews are cached")
	kubeconfig := flag.String("kubeconfig", "", "kubeconfig for running outside the cluster (default: in-cluster config)")
	flag.Parse()

	upstreamURL, err := url.Parse(*upstream)
	if err != nil || upstreamURL.Scheme == "" || upstreamURL.Host == "" {
		fail("-upstream must be an absolute URL", "value", *upstream)
	}
	if !regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_.]*$`).MatchString(*namespaceField) {
		fail("-namespace-field must be a plain field name", "value", *namespaceField)
	}

	var config *rest.Config
	if *kubeconfig != "" {
		config, err = clientcmd.BuildConfigFromFlags("", *kubeconfig)
	} else {
		config, err = rest.InClusterConfig()
	}
	if err != nil {
		fail("cannot load Kubernetes client config", "err", err)
	}
	client, err := kubernetes.NewForConfig(config)
	if err != nil {
		fail("cannot create Kubernetes client", "err", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) { _, _ = w.Write([]byte("ok")) })
	mux.Handle("/api/logs/v1/", NewProxy(upstreamURL, NewAuthorizer(client, *cacheTTL), *namespaceField))

	server := &http.Server{
		Addr:              *listen,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
		// No WriteTimeout: live tailing keeps responses open.
	}
	slog.Info("serving", "listen", *listen, "upstream", upstreamURL.String())
	if err := server.ListenAndServe(); err != nil {
		fail("server stopped", "err", err)
	}
}

func fail(msg string, args ...any) {
	slog.Error(msg, args...)
	os.Exit(1)
}

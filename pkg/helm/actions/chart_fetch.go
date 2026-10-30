package actions

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"helm.sh/helm/v4/pkg/action"
	chart "helm.sh/helm/v4/pkg/chart/v2"
	"helm.sh/helm/v4/pkg/chart/v2/loader"
	"helm.sh/helm/v4/pkg/downloader"
	"helm.sh/helm/v4/pkg/getter"
	"helm.sh/helm/v4/pkg/registry"
	"helm.sh/helm/v4/pkg/repo/v1"
	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/helm/fetcherr"
	"github.com/openshift/console/pkg/utils"
)

func locateChart(opts *action.ChartPathOptions, registryClient *registry.Client, location string) (string, error) {
	path, err := locateChartWithPinnedDial(opts, registryClient, location)
	if err != nil {
		klog.V(4).Infof("chart locate failed: %v", err)
		return "", fetcherr.SanitizeChartLocateError(err)
	}
	return path, nil
}

func loadLocatedChart(path string) (*chart.Chart, error) {
	loaded, err := loader.Load(path)
	if err != nil {
		klog.V(4).Infof("chart load failed for %s: %v", path, err)
		return nil, fetcherr.SanitizeChartLoadError(err)
	}
	return loaded, nil
}

// locateChartWithPinnedDial follows Helm's ChartPathOptions.LocateChart and
// gives the chart getter a transport that connects to an address from one DNS
// lookup. registryClient is supplied by the caller because Helm keeps it
// unexported on ChartPathOptions. LocateChart cannot take that transport, so
// this is a copy of its body and must stay aligned with it.
func locateChartWithPinnedDial(opts *action.ChartPathOptions, registryClient *registry.Client, name string) (string, error) {
	if registry.IsOCI(name) && registryClient == nil {
		return "", fmt.Errorf("unable to lookup chart %q, missing registry client", name)
	}

	name = strings.TrimSpace(name)
	version := strings.TrimSpace(opts.Version)

	if opts.RepoURL == "" {
		if _, err := os.Stat(name); err == nil {
			abs, err := filepath.Abs(name)
			if err != nil {
				return abs, err
			}
			if opts.Verify {
				if _, err := downloader.VerifyChart(abs, abs+".prov", opts.Keyring); err != nil {
					return "", err
				}
			}
			return abs, nil
		}
		if filepath.IsAbs(name) || strings.HasPrefix(name, ".") {
			return name, fmt.Errorf("path %q not found", name)
		}
	}

	transport, err := chartTransport(opts)
	if err != nil {
		return "", err
	}
	getters := getter.All(settings, getter.WithTransport(transport))

	dl := downloader.ChartDownloader{
		Out:     os.Stdout,
		Keyring: opts.Keyring,
		Getters: getters,
		Options: []getter.Option{
			getter.WithPassCredentialsAll(opts.PassCredentialsAll),
			getter.WithTLSClientConfig(opts.CertFile, opts.KeyFile, opts.CaFile),
			getter.WithInsecureSkipVerifyTLS(opts.InsecureSkipTLSVerify),
			getter.WithPlainHTTP(opts.PlainHTTP),
			getter.WithBasicAuth(opts.Username, opts.Password),
			getter.WithTransport(transport),
		},
		RepositoryConfig: settings.RepositoryConfig,
		RepositoryCache:  settings.RepositoryCache,
		ContentCache:     settings.ContentCache,
		RegistryClient:   registryClient,
	}

	if registry.IsOCI(name) {
		dl.Options = append(dl.Options, getter.WithRegistryClient(registryClient))
	}

	if opts.Verify {
		dl.Verify = downloader.VerifyAlways
	}
	if opts.RepoURL != "" {
		chartURL, err := repo.FindChartInRepoURL(
			opts.RepoURL,
			name,
			getters,
			repo.WithChartVersion(version),
			repo.WithClientTLS(opts.CertFile, opts.KeyFile, opts.CaFile),
			repo.WithUsernamePassword(opts.Username, opts.Password),
			repo.WithInsecureSkipTLSVerify(opts.InsecureSkipTLSVerify),
			repo.WithPassCredentialsAll(opts.PassCredentialsAll),
		)
		if err != nil {
			return "", err
		}
		name = chartURL

		// Only pass the user/pass on when the user has said to or when the
		// location of the chart repo and the chart are the same domain.
		u1, err := url.Parse(opts.RepoURL)
		if err != nil {
			return "", err
		}
		u2, err := url.Parse(chartURL)
		if err != nil {
			return "", err
		}

		// Host on URL (returned from url.Parse) contains the port if present.
		// This check ensures credentials are not passed between different
		// services on different ports.
		if opts.PassCredentialsAll || chartURLEqual(u1, u2) {
			dl.Options = append(dl.Options, getter.WithBasicAuth(opts.Username, opts.Password))
		} else {
			dl.Options = append(dl.Options, getter.WithBasicAuth("", ""))
		}
	} else {
		dl.Options = append(dl.Options, getter.WithBasicAuth(opts.Username, opts.Password))
	}

	if err := os.MkdirAll(settings.RepositoryCache, 0o755); err != nil {
		return "", err
	}

	filename, _, err := dl.DownloadToCache(name, version)
	if err != nil {
		return "", err
	}

	lname, err := filepath.Abs(filename)
	if err != nil {
		return filename, err
	}
	return lname, nil
}

func chartTransport(opts *action.ChartPathOptions) (*http.Transport, error) {
	tlsConfig, err := chartTLSConfig(opts)
	if err != nil {
		return nil, err
	}
	transport := http.DefaultTransport.(*http.Transport).Clone()
	// A chart archive is already a gzip file. With compression left enabled,
	// the client sends Accept-Encoding: gzip and decompresses the response
	// before Helm can read the archive.
	transport.DisableCompression = true
	transport.TLSClientConfig = tlsConfig
	// The dial timeout and keepalive live inside DefaultTransport's dial
	// function, which this replacement discards.
	dialer := &net.Dialer{Timeout: 30 * time.Second, KeepAlive: 30 * time.Second}
	transport.DialContext = func(ctx context.Context, network, addr string) (net.Conn, error) {
		return utils.DialPinnedContext(ctx, dialer, network, addr)
	}
	return transport, nil
}

func chartTLSConfig(opts *action.ChartPathOptions) (*tls.Config, error) {
	if opts == nil || (!opts.InsecureSkipTLSVerify && opts.CertFile == "" && opts.KeyFile == "" && opts.CaFile == "") {
		return nil, nil
	}
	cfg := &tls.Config{InsecureSkipVerify: opts.InsecureSkipTLSVerify}
	if opts.CertFile != "" || opts.KeyFile != "" {
		cert, err := tls.LoadX509KeyPair(opts.CertFile, opts.KeyFile)
		if err != nil {
			return nil, fmt.Errorf("can't create TLS config for client: %w", err)
		}
		cfg.Certificates = []tls.Certificate{cert}
	}
	if opts.CaFile != "" {
		pemBytes, err := os.ReadFile(opts.CaFile)
		if err != nil {
			return nil, fmt.Errorf("can't create TLS config for client: %w", err)
		}
		pool := x509.NewCertPool()
		if !pool.AppendCertsFromPEM(pemBytes) {
			return nil, fmt.Errorf("can't create TLS config for client: failed to append certificates from pem block")
		}
		cfg.RootCAs = pool
	}
	return cfg, nil
}

func chartPortOrDefault(u *url.URL) string {
	if p := u.Port(); p != "" {
		return p
	}
	switch u.Scheme {
	case "http":
		return "80"
	case "https":
		return "443"
	default:
		return ""
	}
}

func chartURLEqual(u1, u2 *url.URL) bool {
	return u1.Scheme == u2.Scheme && u1.Hostname() == u2.Hostname() && chartPortOrDefault(u1) == chartPortOrDefault(u2)
}

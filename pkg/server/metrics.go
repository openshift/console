package server

import (
	"github.com/prometheus/client_golang/prometheus"
	"net/http"
	"net/url"
)

// TODO: move the metrics funcs here
// and the guages, etc.

var (
	appVersion = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "console_version",
		Help: "Version information about this binary",
		ConstLabels: map[string]string{
			"version": "v0.1.0",
		},
	})
	apiRequestsTotal = prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "console_api_requests_total",
		Help: "Count of all HTTP requests against the API",
	}, []string{"code", "method", "path", "referer"})
)


// NOTE: by default, promhttp provides:
//   promhttp.InstrumentHandlerCounter(apiRequestsTotal, handler)
// but this handler does not allow for the additional "path" label, which
// we desire.
func InstrumentAPIHandlerCounter(counter *prometheus.CounterVec, next http.Handler, path string) http.HandlerFunc {
	return http.HandlerFunc(func(writer http.ResponseWriter, req *http.Request) {

		// we need to let the request be served before we can check the response status
		next.ServeHTTP(writer, req)

		// remove the domain? note, will still leak namespaces, etc
		from, err := url.Parse(req.Referer())
		if err != nil {
			// handle err
		}
		apiRequestsTotal.With(prometheus.Labels{
			// TODO: this is a little fiddly to unwrap
			"code": "TODO",
			"method": req.Method,
			// TODO: decide if we care about domain or not.
			"referer": from.Path,
			// "referer": req.Referer(),
			"path": path,
		}).Inc()
	})
}


// to use for page view when we track those
// req.Header.Get("User-Agent")
func InstrumentPageViewCounter() {}

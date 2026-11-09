package httptransport

import (
	"net/http"
	"sync"
	"sync/atomic"

	"k8s.io/apiserver/pkg/server/dynamiccertificates"
	"k8s.io/klog/v2"
)

type dynamicTransport struct {
	config *Config
	// rebuildMu serializes rebuilds so that a slower rebuild that read stale CA
	// content can't overwrite a newer one. RoundTrip doesn't take it.
	rebuildMu sync.Mutex
	// transport is never nil: NewRoundTripper stores it before registering
	// for any notifications.
	transport atomic.Pointer[http.Transport]
}

var _ http.RoundTripper = &dynamicTransport{}
var _ dynamiccertificates.Listener = &dynamicTransport{}

func (t *dynamicTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	return t.transport.Load().RoundTrip(request)
}

// CloseIdleConnections closes any idle connections held by the current
// underlying transport, so http.Client.CloseIdleConnections works through this
// wrapper.
func (t *dynamicTransport) CloseIdleConnections() {
	t.transport.Load().CloseIdleConnections()
}

// Enqueue is the dynamiccertificates.Listener callback invoked when a CA content
// provider reports a change. It rebuilds asynchronously so the provider's
// notification goroutine isn't blocked. Each notification starts one rebuild;
// rebuilds are serialized and read the provider content only once holding the
// lock, so the last one always reflects the newest content. Redundant rebuilds
// are cheap and CA changes are rare.
func (t *dynamicTransport) Enqueue() {
	go t.rebuild()
}

// rebuild builds a new transport from the current configuration and swaps it in.
// On failure the current transport is kept.
func (t *dynamicTransport) rebuild() {
	t.rebuildMu.Lock()
	defer t.rebuildMu.Unlock()

	transport, err := t.config.newHTTPTransport()
	if err != nil {
		klog.ErrorS(err, "Unable to rebuild outbound HTTP transport after CA content changed; continuing with the last known-good transport")
		return
	}

	t.transport.Swap(transport).CloseIdleConnections()
	klog.V(2).InfoS("Rebuilt outbound HTTP transport after CA content changed")
}

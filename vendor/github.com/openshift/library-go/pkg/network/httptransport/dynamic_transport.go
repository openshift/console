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
	// rebuildMu serializes rebuilds so concurrent provider notifications cannot
	// race to publish transports. RoundTrip reads transport without the lock.
	rebuildMu sync.Mutex
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
// provider reports a change. CA rotations are rare and never bursty, so a single
// serialized rebuild per notification is sufficient.
func (t *dynamicTransport) Enqueue() {
	t.rebuildMu.Lock()
	defer t.rebuildMu.Unlock()
	t.rebuild()
}

func (t *dynamicTransport) rebuild() {
	transport, err := t.config.newHTTPTransport()
	if err != nil {
		klog.ErrorS(err, "Unable to rebuild outbound HTTP transport after CA content changed; continuing with the last known-good transport")
		return
	}

	oldTransport := t.transport.Swap(transport)
	if oldTransport != nil {
		oldTransport.CloseIdleConnections()
	}
	klog.V(2).InfoS("Rebuilt outbound HTTP transport after CA content changed")
}

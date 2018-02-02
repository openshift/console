package proxy

import (
	"crypto/tls"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"golang.org/x/net/websocket"
)

type Config struct {
	HeaderBlacklist []string
	Endpoint        *url.URL
	TLSClientConfig *tls.Config
	Director        func(*http.Request)
}

type Proxy struct {
	reverseProxy *httputil.ReverseProxy
	config       *Config
}

func filterHeaders(r *http.Response) error {
	badHeaders := []string{"Connection", "Keep-Alive", "Proxy-Connection", "Transfer-Encoding", "Upgrade"}
	for _, h := range badHeaders {
		r.Header.Del(h)
	}
	return nil
}

func NewProxy(cfg *Config) *Proxy {
	// Copy of http.DefaultTransport with TLSClientConfig added
	insecureTransport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		Dial: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).Dial,
		TLSClientConfig:     cfg.TLSClientConfig,
		TLSHandshakeTimeout: 10 * time.Second,
	}

	reverseProxy := &httputil.ReverseProxy{
		FlushInterval:  time.Millisecond * 500,
		Transport:      insecureTransport,
		ModifyResponse: filterHeaders,
	}

	proxy := &Proxy{
		reverseProxy: reverseProxy,
		config:       cfg,
	}

	if cfg.Director == nil {
		cfg.Director = proxy.director
	}
	reverseProxy.Director = cfg.Director

	return proxy
}

func SingleJoiningSlash(a, b string) string {
	aslash := strings.HasSuffix(a, "/")
	bslash := strings.HasPrefix(b, "/")
	switch {
	case aslash && bslash:
		return a + b[1:]
	case !aslash && !bslash:
		return a + "/" + b
	}
	return a + b
}

// director is a default function to rewrite the request being
// proxied. If the user does not supply a custom director function,
// then this will be used.
func (p *Proxy) director(r *http.Request) {
	for _, h := range p.config.HeaderBlacklist {
		r.Header.Del(h)
	}

	r.Host = p.config.Endpoint.Host
	r.URL.Host = p.config.Endpoint.Host
	r.URL.Path = SingleJoiningSlash(p.config.Endpoint.Path, r.URL.Path)
	r.URL.Scheme = p.config.Endpoint.Scheme
}

func (p *Proxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	isWebsocket := false
	upgrades := r.Header["Upgrade"]

	for _, upgrade := range upgrades {
		if strings.ToLower(upgrade) == "websocket" {
			isWebsocket = true
			break
		}
	}

	if !isWebsocket {
		p.reverseProxy.ServeHTTP(w, r)
		return
	}

	p.config.Director(r)

	if r.URL.Scheme == "https" {
		r.URL.Scheme = "wss"
	} else {
		r.URL.Scheme = "ws"
	}

	subProtocol := ""
	proxiedHeader := make(http.Header, len(r.Header))
	for key, value := range r.Header {
		if key != "Sec-Websocket-Protocol" {
			// Do not proxy the subprotocol to the API server because k8s does not understand it yet
			proxiedHeader.Set(key, r.Header.Get(key))
			continue
		}

		for _, protocols := range value {
			for _, protocol := range strings.Split(protocols, ",") {
				if strings.TrimSpace(protocol) == "base64.binary.k8s.io" {
					subProtocol = "base64.binary.k8s.io"
				}
			}
		}
	}

	config := &websocket.Config{
		Location:  r.URL,
		Version:   websocket.ProtocolVersionHybi13,
		TlsConfig: p.config.TLSClientConfig,
		Header:    proxiedHeader,
		// NOTE (ericchiang): K8s might not enforce this but websockets requests are
		// required to supply an origin.
		Origin: &url.URL{Scheme: "http", Host: "localhost"},
	}

	backend, err := websocket.DialConfig(config)
	if err != nil {
		if dialErr, ok := err.(*websocket.DialError); ok {
			if herr, ok := dialErr.Err.(*websocket.HTTPStatusError); ok {
				statusCode := herr.StatusCode
				log.Printf("Failed to dial backend: '%v' statusCode: %v", dialErr, statusCode)
				if statusCode == 0 {
					statusCode = http.StatusBadGateway
				}
				http.Error(w, "bad gateway", statusCode)
				return
			}
		}
		log.Printf("Failed to dial backend: '%v'", err)
		http.Error(w, "bad gateway", http.StatusBadGateway)
		return
	}
	defer backend.Close()

	h := websocket.Handler(func(frontend *websocket.Conn) {
		defer frontend.Close()

		errc := make(chan error, 2)

		// Can't just use io.Copy here since browsers care about frame headers.
		go func() { errc <- copyFrames(frontend, backend) }()
		go func() { errc <- copyFrames(backend, frontend) }()

		// K8s doesn't read websocket close frames, which browsers use to perform graceful
		// shutdowns. This causes browsers to hold open connections through refreshes and
		// navigation until a user shuts down the frontend connection forcefully (e.g. by
		// closing the window).
		//
		// Our websocket handler does listen for this message, so if our connection to the
		// frontend is closed also kill the connection to the backend.
		//
		// Only wait for a single error and let the defers close both connections.
		<-errc

	})
	// We must reply with support for a given subprotocol or the client will bail
	handshaker := func(config *websocket.Config, req *http.Request) (err error) {
		if subProtocol != "" {
			config.Protocol = []string{subProtocol}
		}
		return nil
	}
	s := websocket.Server{
		Handler:   h,
		Handshake: handshaker,
	}
	s.ServeHTTP(w, r)
}

func copyFrames(dest, src *websocket.Conn) error {
	for {
		// Must use a websocket.Codec here since the Read method doesn't preserve frames.
		frame := new(wsFrame)
		if err := frameCodec.Receive(src, frame); err != nil {
			return err
		}

		if err := frameCodec.Send(dest, frame); err != nil {
			return err
		}
	}
}

// frameCodec is a websocket.Codec which preserves frame types for copying.

//
// This differs from websocket.Message which presents a different frame type for "[]byte" and "string".
var frameCodec = websocket.Codec{Marshal: marshalFrame, Unmarshal: unmarshalFrame}

type wsFrame struct {
	payload     []byte
	payloadType byte
}

func marshalFrame(v interface{}) (data []byte, payloadType byte, err error) {
	frame, ok := v.(*wsFrame)
	if !ok {
		return nil, 0, fmt.Errorf("expected *wsFrame, got %t", v)
	}
	return frame.payload, frame.payloadType, nil
}

func unmarshalFrame(data []byte, payloadType byte, v interface{}) (err error) {
	frame, ok := v.(*wsFrame)
	if !ok {
		return fmt.Errorf("expected *wsFrame, got %t", v)
	}
	*frame = wsFrame{data, payloadType}
	return nil
}

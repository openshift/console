package proxy

import (
	"crypto/tls"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type Config struct {
	HeaderBlacklist []string
	Endpoint        *url.URL
	TLSClientConfig *tls.Config
	Director        func(*http.Request)
	Origin          string
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

// decodeSubprotocol decodes the impersonation "headers" on a websocket.
// See k8s-actions.js for how this is encoded.
func decodeSubprotocol(encodedProtocol string) (string, error) {
	split := strings.Split(encodedProtocol, "_")
	var bytes []byte
	for _, i := range split {
		thing, err := strconv.Atoi(i)
		if err != nil {
			return "", err
		}
		bytes = append(bytes, byte(thing))
	}
	return string(bytes), nil
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
			// Do not proxy the subprotocol to the API server because k8s does not understand what we're sending
			proxiedHeader.Set(key, r.Header.Get(key))
			continue
		}

		for _, protocols := range value {
			for _, protocol := range strings.Split(protocols, ",") {
				protocol = strings.TrimSpace(protocol)
				// TODO: secure by stripping newlines & other invalid stuff
				if strings.HasPrefix(protocol, "Impersonate-User.") {
					encodedProtocol := strings.TrimPrefix(protocol, "Impersonate-User.")
					decodedProtocol, err := decodeSubprotocol(encodedProtocol)
					if err != nil {
						errMsg := fmt.Sprintf("Error decoding Impersonate-User subprotocol: %v", err)
						http.Error(w, errMsg, http.StatusBadRequest)
						return
					}
					proxiedHeader.Set("Impersonate-User", decodedProtocol)
					subProtocol = protocol
				} else if strings.HasPrefix(protocol, "Impersonate-Group.") {
					encodedProtocol := strings.TrimPrefix(protocol, "Impersonate-Group.")
					decodedProtocol, err := decodeSubprotocol(encodedProtocol)
					if err != nil {
						errMsg := fmt.Sprintf("Error decoding Impersonate-Group subprotocol: %v", err)
						http.Error(w, errMsg, http.StatusBadRequest)
						return
					}
					proxiedHeader.Set("Impersonate-User", string(decodedProtocol))
					proxiedHeader.Set("Impersonate-Group", string(decodedProtocol))
					subProtocol = protocol
				}
			}
		}
	}

	// Filter websocket headers. Gorilla adds them automatically.
	websocketHeaders := []string{
		"Connection",
		"Sec-Websocket-Extensions",
		"Sec-Websocket-Key",
		// Do not proxy the subprotocol to the API server because k8s does not understand it yet
		"Sec-Websocket-Protocol",
		"Sec-Websocket-Version",
		"Upgrade",
	}
	for _, header := range websocketHeaders {
		proxiedHeader.Del(header)
	}

	// NOTE (ericchiang): K8s might not enforce this but websockets requests are
	// required to supply an origin.
	proxiedHeader.Add("Origin", "http://localhost")

	dialer := &websocket.Dialer{
		TLSClientConfig: p.config.TLSClientConfig,
	}

	backend, resp, err := dialer.Dial(r.URL.String(), proxiedHeader)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to dial backend: '%v'", err)
		statusCode := http.StatusBadGateway
		if resp == nil || resp.StatusCode == 0 {
			log.Println(errMsg)
		} else {
			statusCode = resp.StatusCode
			if resp.Request == nil {
				log.Printf("%s Status: '%v' (no request object)", errMsg, resp.Status)
			} else {
				log.Printf("%s Status: '%v' URL: '%v'", errMsg, resp.Status, resp.Request.URL)
			}
		}
		http.Error(w, errMsg, statusCode)
		return
	}
	defer backend.Close()

	upgrader := &websocket.Upgrader{
		Subprotocols: []string{subProtocol},
		CheckOrigin: func(r *http.Request) bool {
			origin := r.Header["Origin"]
			if p.config.Origin == "" {
				log.Printf("CheckOrigin: Proxy has no configured Origin. Allowing origin %v to %v", origin, r.URL)
				return true
			}
			if len(origin) == 0 {
				log.Printf("CheckOrigin: No origin header. Denying request to %v", r.URL)
				return false
			}
			if p.config.Origin == origin[0] {
				return true
			}
			log.Printf("CheckOrigin '%v' != '%v'", p.config.Origin, origin[0])
			return false
		},
	}
	frontend, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade websocket to client: '%v'", err)
		return
	}

	defer frontend.Close()

	errc := make(chan error, 2)

	// Can't just use io.Copy here since browsers care about frame headers.
	go func() { errc <- copyMsgs(frontend, backend) }()
	go func() { errc <- copyMsgs(backend, frontend) }()

	// Only wait for a single error and let the defers close both connections.
	<-errc
}

func copyMsgs(dest, src *websocket.Conn) error {
	for {
		messageType, msg, err := src.ReadMessage()
		if err != nil {
			return err
		}

		if err := dest.WriteMessage(messageType, msg); err != nil {
			return err
		}
	}
}

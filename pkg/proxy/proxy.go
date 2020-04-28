package proxy

import (
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var websocketPingInterval = 30 * time.Second
var websocketTimeout = 30 * time.Second

type Config struct {
	HeaderBlacklist []string
	Endpoint        *url.URL
	TLSClientConfig *tls.Config
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
	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		Dial: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).Dial,
		TLSClientConfig:     cfg.TLSClientConfig,
		TLSHandshakeTimeout: 10 * time.Second,
	}

	reverseProxy := httputil.NewSingleHostReverseProxy(cfg.Endpoint)
	reverseProxy.FlushInterval = time.Millisecond * 100
	reverseProxy.Transport = transport
	reverseProxy.ModifyResponse = filterHeaders

	proxy := &Proxy{
		reverseProxy: reverseProxy,
		config:       cfg,
	}

	return proxy
}

func SingleJoiningSlash(a, b string) string {
	if b == "" {
		return a
	}
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
// Subprotocols don't allow '=' or '/'
func decodeSubprotocol(encodedProtocol string) (string, error) {
	encodedProtocol = strings.Replace(encodedProtocol, "_", "=", -1)
	encodedProtocol = strings.Replace(encodedProtocol, "-", "/", -1)
	decodedProtocol, err := base64.StdEncoding.DecodeString(encodedProtocol)
	return string(decodedProtocol), err
}

var headerBlacklist = []string{"Cookie", "X-CSRFToken"}

func (p *Proxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Block scripts from running in proxied content for browsers that support Content-Security-Policy.
	w.Header().Set("Content-Security-Policy", "sandbox;")
	// Add `X-Content-Security-Policy` for IE11 and older browsers.
	w.Header().Set("X-Content-Security-Policy", "sandbox;")

	isWebsocket := false
	upgrades := r.Header["Upgrade"]

	for _, upgrade := range upgrades {
		if strings.ToLower(upgrade) == "websocket" {
			isWebsocket = true
			break
		}
	}

	for _, h := range headerBlacklist {
		r.Header.Del(h)
	}

	// Include `system:authenticated` when impersonating groups so that basic requests that all
	// users can run like self-subject access reviews work.
	if len(r.Header["Impersonate-Group"]) > 0 {
		r.Header.Add("Impersonate-Group", "system:authenticated")
	}

	r.Host = p.config.Endpoint.Host
	r.URL.Host = p.config.Endpoint.Host
	r.URL.Scheme = p.config.Endpoint.Scheme

	if !isWebsocket {
		p.reverseProxy.ServeHTTP(w, r)
		return
	}

	r.URL.Path = SingleJoiningSlash(p.config.Endpoint.Path, r.URL.Path)

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
				// "Impersonate-User" and "Impersonate-Group" and bridge specific (not a k8s thing)
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
				} else {
					proxiedHeader.Set("Sec-Websocket-Protocol", protocol)
					subProtocol = protocol
				}
			}
		}
	}

	// Filter websocket headers.
	websocketHeaders := []string{
		"Connection",
		"Sec-Websocket-Extensions",
		"Sec-Websocket-Key",
		// NOTE: kans - Sec-Websocket-Protocol must be proxied in the headers
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

	ticker := time.NewTicker(websocketPingInterval)
	var writeMutex sync.Mutex // Needed because ticker & copy are writing to frontend in separate goroutines

	defer func() {
		ticker.Stop()
		frontend.Close()
	}()

	errc := make(chan error, 2)

	// Can't just use io.Copy here since browsers care about frame headers.
	go func() { errc <- copyMsgs(nil, frontend, backend) }()
	go func() { errc <- copyMsgs(&writeMutex, backend, frontend) }()

	for {
		select {
		case <-errc:
			// Only wait for a single error and let the defers close both connections.
			return
		case <-ticker.C:
			writeMutex.Lock()
			// Send pings to client to prevent load balancers and other middlemen from closing the connection early
			err := frontend.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(websocketTimeout))
			writeMutex.Unlock()
			if err != nil {
				return
			}
		}
	}
}

func copyMsgs(writeMutex *sync.Mutex, dest, src *websocket.Conn) error {
	for {
		messageType, msg, err := src.ReadMessage()
		if err != nil {
			return err
		}

		if writeMutex == nil {
			err = dest.WriteMessage(messageType, msg)
		} else {
			writeMutex.Lock()
			err = dest.WriteMessage(messageType, msg)
			writeMutex.Unlock()
		}

		if err != nil {
			return err
		}
	}
}

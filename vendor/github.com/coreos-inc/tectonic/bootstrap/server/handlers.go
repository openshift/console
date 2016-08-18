package server

import (
	"fmt"
	"net/http"
	"sync"

	log "github.com/Sirupsen/logrus"
)

// logRequests logs HTTP requests and calls the next handler.
func logRequests(next http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, req *http.Request) {
		log.Debugf("HTTP %s %v", req.Method, req.URL)
		if next != nil {
			next.ServeHTTP(w, req)
		}
	}
	return http.HandlerFunc(fn)
}

// syncHandler synchronizes request handling and calls the next handler. Only
// one request may be processed by the handler chain at a time.
func syncHandler(next http.Handler) http.Handler {
	mu := &sync.Mutex{}
	fn := func(w http.ResponseWriter, req *http.Request) {
		mu.Lock()
		if next != nil {
			next.ServeHTTP(w, req)
		}
		mu.Unlock()
	}
	return http.HandlerFunc(fn)
}

// homeHandler responds to root path requests with the service name.
func homeHandler() http.Handler {
	fn := func(w http.ResponseWriter, req *http.Request) {
		if req.URL.Path != "/" {
			http.NotFound(w, req)
			return
		}
		fmt.Fprintf(w, "Tectonic Installer")
	}
	return http.HandlerFunc(fn)
}

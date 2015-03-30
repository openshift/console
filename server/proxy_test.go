package server

import (
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httptest"
	"net/url"
	"reflect"
	"strings"
	"testing"

	"golang.org/x/net/websocket"
)

func TestProxyDirector(t *testing.T) {
	tests := []struct {
		target    url.URL
		blacklist []string
		in        *http.Request
		want      *http.Request
	}{
		{
			target: url.URL{Scheme: "http", Host: "target.com", Path: "/target/base"},
			in: &http.Request{
				Method: "POST",
				Host:   "source.com",
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "/clients"},
				Header: http.Header{"Content-Type": []string{"application/json"}},
			},
			want: &http.Request{
				Method: "POST",
				Host:   "target.com",
				URL:    &url.URL{Scheme: "http", Host: "target.com", Path: "/target/base/clients"},
				Header: http.Header{"Content-Type": []string{"application/json"}},
			},
		},
		// host with ports
		{
			target: url.URL{Scheme: "http", Host: "target.com:1234", Path: "/target/base"},
			in: &http.Request{
				Method: "POST",
				Host:   "source.com",
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "/clients"},
			},
			want: &http.Request{
				Method: "POST",
				Host:   "target.com:1234",
				URL:    &url.URL{Scheme: "http", Host: "target.com:1234", Path: "/target/base/clients"},
			},
		},
		// use target scheme
		{
			target: url.URL{Scheme: "https", Host: "target.com", Path: "/target/base"},
			in: &http.Request{
				Method: "POST",
				Host:   "source.com",
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "/clients"},
			},
			want: &http.Request{
				Method: "POST",
				Host:   "target.com",
				URL:    &url.URL{Scheme: "https", Host: "target.com", Path: "/target/base/clients"},
			},
		},
		// strip blacklisted headers, keeps others
		{
			target:    url.URL{Scheme: "http", Host: "target.com", Path: "/target/base"},
			blacklist: []string{"Cookie", "User-Agent"},
			in: &http.Request{
				Method: "POST",
				Host:   "source.com",
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "/clients"},
				Header: http.Header{"Content-Type": []string{"application/json"}, "Cookie": []string{"choco-chip"}, "User-Agent": []string{"web-browser"}},
			},
			want: &http.Request{
				Method: "POST",
				Host:   "target.com",
				URL:    &url.URL{Scheme: "http", Host: "target.com", Path: "/target/base/clients"},
				Header: http.Header{"Content-Type": []string{"application/json"}},
			},
		},
		// keep query vars
		{
			target: url.URL{Scheme: "http", Host: "target.com", Path: "/target/base"},
			in: &http.Request{
				Method: "GET",
				Host:   "source.com",
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "/clients", RawQuery: "foo=bar&abc=xyz"},
			},
			want: &http.Request{
				Method: "GET",
				Host:   "target.com",
				URL:    &url.URL{Scheme: "http", Host: "target.com", Path: "/target/base/clients", RawQuery: "foo=bar&abc=xyz"},
			},
		},
	}

	for i, tt := range tests {
		cfg := proxyConfig{
			Target:          tt.target,
			HeaderBlacklist: tt.blacklist,
		}
		p := newProxy(cfg)
		p.reverseProxy.Director(tt.in)

		if !reflect.DeepEqual(*tt.want, *tt.in) {
			t.Errorf("case %d: invalid result, \nwant=%v, \ngot=%v", i, *tt.want, *tt.in)
		}
	}
}

func TestProxyWebsocket(t *testing.T) {
	proxyURL, closer, err := startProxyServer()
	if err != nil {
		t.Fatalf("problem setting up proxy server: %v", err)
	}
	defer closer()

	ws, err := websocket.Dial(toWSScheme(proxyURL)+"/proxy/lower", "", "http://localhost")
	if err != nil {
		t.Fatalf("error connecting to /proxy/lower as websocket: %v", err)
		return
	}
	defer ws.Close()

	ws.Write([]byte("HI"))
	res, err := readStringFromWS(ws)
	if err != nil {
		t.Fatalf("error reading from websocket: %v", err)
	}
	if res != "hi" {
		t.Errorf("res == %v, want %v", res, "hi")
	}
}

func TestProxyHTTP(t *testing.T) {
	proxyURL, closer, err := startProxyServer()
	if err != nil {
		t.Fatalf("problem setting up proxy server: %v", err)
	}
	defer closer()

	res, err := http.Get(proxyURL + "/proxy/static")
	if err != nil {
		t.Fatalf("err GETting from /proxy/static: %v", err)
	}
	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		t.Fatalf("err reading res.Body: %v", err)
	}
	if string(body) != "static" {
		t.Errorf("string(body) == %q, want %q", string(body), "static")
	}

}

// startProxyServer starts a server, and a proxy server that proxies requests to it.
// The URL to the server and a function which closes the servers is returned.
// The underlying server has two endpoints: /static which always returns
// "static" in the body of the response, and /lower, which is a websocket
// endppint which receives strings and responds with lowercased versions of
// those strings.
// The proxy server proxies requests to the underlying server on the endpoint "/proxy".
func startProxyServer() (string, func(), error) {
	// Setup the server we want to proxy.
	mux := http.NewServeMux()
	mux.Handle("/lower", websocket.Handler(lowercaseServer))
	mux.HandleFunc("/static", staticServer)
	server := httptest.NewServer(mux)

	// Setup the proxyServer
	targetURL, err := url.Parse(server.URL)
	if err != nil {
		return "", nil, err
	}
	targetURL.Path = "/"
	proxy := newProxy(proxyConfig{
		Target: *targetURL,
	})
	proxyMux := http.NewServeMux()
	proxyMux.Handle("/proxy/", http.StripPrefix("/proxy/", proxy))
	proxyServer := httptest.NewServer(proxyMux)

	return proxyServer.URL, func() {
		proxyServer.Close()
		server.Close()
	}, nil
}

func lowercaseServer(ws *websocket.Conn) {
	for {
		str, err := readStringFromWS(ws)
		if err != nil {
			log.Fatalf("err reading from websocket: %v", err)
			return
		}
		_, err = ws.Write([]byte(strings.ToLower(str)))
		if err != nil {
			log.Fatalf("err reading to websocket: %v", err)
			return
		}
		return
	}
}

func staticServer(res http.ResponseWriter, req *http.Request) {
	res.Write([]byte("static"))
}

func readStringFromWS(ws *websocket.Conn) (string, error) {
	buf := make([]byte, 512)
	n, err := ws.Read(buf)
	if err != nil {
		return "", err
	}
	return string(buf[:n]), nil
}

// toWSScheme changes the scheme of a valid URL to "ws".
func toWSScheme(url_ string) string {
	parsed, err := url.Parse(url_)
	if err != nil {
		panic(err)
	}
	parsed.Scheme = "ws"
	return parsed.String()
}

package proxy

import (
	"fmt"
	"io/ioutil"
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
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "clients"},
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
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "clients"},
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
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "clients"},
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
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "clients"},
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
				URL:    &url.URL{Scheme: "http", Host: "source.com", Path: "clients", RawQuery: "foo=bar&abc=xyz"},
			},
			want: &http.Request{
				Method: "GET",
				Host:   "target.com",
				URL:    &url.URL{Scheme: "http", Host: "target.com", Path: "/target/base/clients", RawQuery: "foo=bar&abc=xyz"},
			},
		},
	}

	for i, tt := range tests {
		p := NewProxy(&Config{
			Endpoint:        &tt.target,
			HeaderBlacklist: tt.blacklist,
		})
		p.reverseProxy.Director(tt.in)

		if !reflect.DeepEqual(*tt.want, *tt.in) {
			t.Errorf("case %d: invalid result, \nwant=%v, \ngot=%v", i, *tt.want, *tt.in)
		}
	}
}

func TestProxyWebsocket(t *testing.T) {
	proxyURL, closer, err := startProxyServer(t)
	if err != nil {
		t.Fatalf("problem setting up proxy server: %v", err)
	}
	defer closer()

	ws, err := websocket.Dial(toWSScheme(proxyURL)+"/proxy/lower", "base64.binary.k8s.io", "http://localhost")
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
	proxyURL, closer, err := startProxyServer(t)
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
func startProxyServer(t *testing.T) (string, func(), error) {
	// Setup the server we want to proxy.
	mux := http.NewServeMux()
	mux.Handle("/lower", websocket.Handler(lowercaseServer(t)))
	mux.HandleFunc("/static", staticServer)
	server := httptest.NewServer(mux)

	// Setup the proxyServer
	targetURL, err := url.Parse(server.URL)
	if err != nil {
		return "", nil, err
	}
	targetURL.Path = ""
	p := NewProxy(&Config{
		Endpoint: targetURL,
	})
	proxyMux := http.NewServeMux()
	proxyMux.Handle("/proxy/", http.StripPrefix("/proxy/", p))
	proxyServer := httptest.NewServer(proxyMux)

	return proxyServer.URL, func() {
		proxyServer.Close()
		server.Close()
	}, nil
}

func lowercaseServer(t *testing.T) func(ws *websocket.Conn) {
	return func(ws *websocket.Conn) {
		for {
			str, err := readStringFromWS(ws)
			if err != nil {
				t.Fatalf("err reading from websocket: %v", err)
			}
			_, err = ws.Write([]byte(strings.ToLower(str)))
			if err != nil {
				t.Fatalf("err reading to websocket: %v", err)
			}
			return
		}
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

func TestProxyRewriteRequestAuthorization(t *testing.T) {
	tests := []struct {
		tok  string
		req  *http.Request
		want string
	}{
		{
			tok:  "",
			req:  mustNewRequestWithHeader(t, http.Header{}),
			want: "",
		},
		{
			tok:  "",
			req:  mustNewRequestWithHeader(t, http.Header{"Authorization": []string{"Bearer bar"}}),
			want: "Bearer bar",
		},
		{
			tok:  "foo",
			req:  mustNewRequestWithHeader(t, http.Header{}),
			want: "Bearer foo",
		},
		{
			tok:  "foo",
			req:  mustNewRequestWithHeader(t, http.Header{"Authorization": []string{"Bearer bar"}}),
			want: "Bearer foo",
		},
	}

	testurl, err := url.Parse("http://example.org/proxied")
	if err != nil {
		panic("test url cannot be parsed")
	}

	for i, tt := range tests {
		c := &Config{
			Endpoint: testurl,
		}
		c.Director = DirectorFromToken(c, tt.tok)
		p := NewProxy(c)
		p.config.Director(tt.req)
		got := tt.req.Header.Get("Authorization")
		if tt.want != got {
			t.Errorf("case %d: unexpected header: want=%q got=%q", i, tt.want, got)
		}
	}
}

func mustNewRequestWithHeader(t *testing.T, hdr http.Header) *http.Request {
	req, err := http.NewRequest("GET", "http://example.com", nil)
	if err != nil {
		t.Fatalf("Failed generating HTTP request: %v", err)
	}
	req.Header = hdr
	return req
}

func DirectorFromToken(config *Config, token string) func(*http.Request) {
	return func(r *http.Request) {
		if token != "" {
			r.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
		}

		for _, h := range config.HeaderBlacklist {
			r.Header.Del(h)
		}

		r.Host = config.Endpoint.Host
		r.URL.Host = config.Endpoint.Host
		r.URL.Path = SingleJoiningSlash(config.Endpoint.Path, r.URL.Path)
		r.URL.Scheme = config.Endpoint.Scheme
	}
}

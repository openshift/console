package proxy

import (
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/gorilla/websocket"
)

func TestProxyWebsocket(t *testing.T) {
	proxyURL, closer, err := startProxyServerWithOrigin(t, "http://localhost")
	if err != nil {
		t.Fatalf("problem setting up proxy server: %v", err)
	}
	defer closer()

	dialer := &websocket.Dialer{
		Subprotocols: []string{"base64.binary.k8s.io"},
	}

	headers := http.Header{}
	headers.Add("Origin", "http://localhost")

	ws, resp, err := dialer.Dial(toWSScheme(proxyURL)+"/proxy/lower", headers)
	if err != nil {
		t.Fatalf("error connecting to /proxy/lower as websocket: %v", err)
	}
	defer ws.Close()
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusSwitchingProtocols {
		t.Errorf("status code = %d, want %d", resp.StatusCode, http.StatusSwitchingProtocols)
	}
	if got := resp.Header.Values("X-Content-Type-Options"); len(got) != 1 || got[0] != "nosniff" {
		t.Errorf("X-Content-Type-Options = %q, want %q", got, []string{"nosniff"})
	}
	if got := resp.Header.Get("Content-Security-Policy"); got != "" {
		t.Errorf("Content-Security-Policy = %q, want empty", got)
	}
	if got := resp.Header.Values("Set-Cookie"); len(got) != 0 {
		t.Errorf("Set-Cookie = %q, want empty", got)
	}
	if got := resp.Header.Values("Sec-WebSocket-Protocol"); len(got) != 1 || got[0] != "base64.binary.k8s.io" {
		t.Errorf("Sec-WebSocket-Protocol = %q, want %q", got, []string{"base64.binary.k8s.io"})
	}
	if got := ws.Subprotocol(); got != "base64.binary.k8s.io" {
		t.Errorf("subprotocol = %q, want %q", got, "base64.binary.k8s.io")
	}

	if err := ws.WriteMessage(websocket.TextMessage, []byte("HI")); err != nil {
		t.Fatalf("error writing websocket message: %v", err)
	}
	res, err := readStringFromWS(ws)
	if err != nil {
		t.Fatalf("error reading from websocket: %v", err)
	}
	if res != "hi" {
		t.Errorf("res == %v, want %v", res, "hi")
	}
}

func TestProxyWebsocketRejectsInvalidOrigin(t *testing.T) {
	proxyURL, closer, err := startProxyServerWithOrigin(t, "http://localhost")
	if err != nil {
		t.Fatalf("problem setting up proxy server: %v", err)
	}
	defer closer()

	headers := http.Header{}
	headers.Add("Origin", "http://example.com")

	ws, resp, err := websocket.DefaultDialer.Dial(toWSScheme(proxyURL)+"/proxy/lower", headers)
	if err == nil {
		ws.Close()
		t.Fatal("expected invalid origin to be rejected")
	}
	if resp == nil {
		t.Fatal("expected an HTTP response for invalid origin")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("status code = %d, want %d", resp.StatusCode, http.StatusForbidden)
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
	body, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatalf("err reading res.Body: %v", err)
	}
	if string(body) != "static" {
		t.Errorf("string(body) == %q, want %q", string(body), "static")
	}

}

func TestProxyDecodeSubprotocol(t *testing.T) {
	tests := []struct {
		encoded string
		decoded string
	}{
		{
			encoded: "8J2SnPCdkpzwnZKc8J2SnA__",
			decoded: "𝒜𝒜𝒜𝒜",
		},
		{
			encoded: "bm9uLXByaXY_",
			decoded: "non-priv",
		},
		{
			encoded: "8J2SnPCfjYbwn42RQPCfjYbwn42R4oiGw6XLhs+GzrHOtc+Czr-Ouc6xz4nOp86oz4zOufCdkpzOm86azqPOs8+BzrvOus+DzpLOps6+4oiC",
			decoded: "𝒜🍆🍑@🍆🍑∆åˆφαεςοιαωΧΨόι𝒜ΛΚΣγρλκσΒΦξ∂",
		},
	}
	for _, test := range tests {
		decoded, err := decodeSubprotocol(test.encoded)
		if err != nil {
			t.Fatalf("err decoding subprotocol %v: %v", test.encoded, err)
		}
		if decoded != test.decoded {
			t.Errorf("decoded %v as %v but expected %v", test.encoded, decoded, test.decoded)
		}
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
	return startProxyServerWithOrigin(t, "")
}

func startProxyServerWithOrigin(t *testing.T, origin string) (string, func(), error) {
	// Setup the server we want to proxy.
	mux := http.NewServeMux()
	mux.HandleFunc("/lower", lowercaseServer(t))
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
		Origin:   origin,
	})
	proxyMux := http.NewServeMux()
	proxyMux.Handle("/proxy/", http.StripPrefix("/proxy/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Set-Cookie", "test-cookie=synthetic")
		p.ServeHTTP(w, r)
	})))
	proxyServer := httptest.NewServer(proxyMux)

	return proxyServer.URL, func() {
		proxyServer.Close()
		server.Close()
	}, nil
}

func lowercaseServer(t *testing.T) func(w http.ResponseWriter, r *http.Request) {
	upgrader := &websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			// TODO: actually check origin!
			return true
		},
	}

	return func(w http.ResponseWriter, r *http.Request) {
		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("Failed to upgrade websocket to client: '%v'", err)
			return
		}
		for {
			str, err := readStringFromWS(ws)
			if err != nil {
				if websocket.IsCloseError(err, websocket.CloseNormalClosure) {
					return
				}
				t.Fatalf("err reading from websocket: %v", err)
			}
			err = ws.WriteMessage(websocket.TextMessage, []byte(strings.ToLower(str)))
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
	// buf := make([]byte, 512)
	_, buf, err := ws.ReadMessage()
	if err != nil {
		return "", err
	}
	return string(buf), nil
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

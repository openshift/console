package httpclient

import (
	"crypto/tls"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/require"
)

type connectProxyLogger struct{ t *testing.T }

func (l connectProxyLogger) Write(p []byte) (int, error) {
	l.t.Logf("proxy: %s", p)
	return len(p), nil
}

// Run each mode in a fresh process because net/http caches proxy environment.
func TestHTTPSProxyCONNECT(t *testing.T) {
	mode := os.Getenv("CONSOLE_CONNECT_TEST_MODE")
	if mode == "" {
		t.Setenv("DISABLE_HTTP2", "")
		for _, mode := range []string{"explicit", "environment"} {
			for _, h2 := range []string{"false", "true"} {
				t.Run(mode+"/h2="+h2, func(t *testing.T) {
					cmd := exec.Command(os.Args[0], "-test.run=^TestHTTPSProxyCONNECT$", "-test.v", "-test.timeout=20s")
					cmd.Env = append(os.Environ(), "CONSOLE_CONNECT_TEST_MODE="+mode, "CONSOLE_CONNECT_TEST_H2="+h2)
					output, err := cmd.CombinedOutput()
					require.NoError(t, err, "%s", output)
				})
			}
		}
		return
	}
	h2 := os.Getenv("CONSOLE_CONNECT_TEST_H2") != "false"
	issuerCA, issuerCert := testCA(t)
	proxyCA, proxyCert := testCA(t)
	issuer := testTLSServer(t, issuerCert)
	var connects atomic.Int32
	proxy := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodConnect || r.Host != "issuer.example.test:443" {
			http.Error(w, "unexpected proxy request", http.StatusBadRequest)
			return
		}
		upstream, err := net.Dial("tcp", issuer.Listener.Addr().String())
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}
		defer upstream.Close()
		downstream, buffered, err := w.(http.Hijacker).Hijack()
		if err != nil {
			t.Error(err)
			return
		}
		defer downstream.Close()
		connects.Add(1)
		fmt.Fprint(buffered, "HTTP/1.1 200 Connection Established\r\n\r\n")
		if err := buffered.Flush(); err != nil {
			t.Error(err)
			return
		}
		go func() {
			io.Copy(downstream, upstream)
			downstream.Close()
		}()
		io.Copy(upstream, buffered.Reader)
	}))
	proxy.EnableHTTP2 = h2
	protocols := []string{"http/1.1"}
	if h2 {
		protocols = []string{"h2", "http/1.1"}
	}
	proxy.TLS = &tls.Config{Certificates: []tls.Certificate{proxyCert}, NextProtos: protocols}
	proxy.Config.ErrorLog = log.New(connectProxyLogger{t}, "", 0)
	proxy.StartTLS()
	t.Cleanup(proxy.Close)

	dir := t.TempDir()
	issuerPath := filepath.Join(dir, "issuer.pem")
	proxyPath := filepath.Join(dir, "proxy.pem")
	writeCA(t, issuerPath, issuerCA)
	writeCA(t, proxyPath, proxyCA)
	config := &ProxyConfig{HTTPSProxy: proxy.URL, TrustedCAFilePath: proxyPath}
	if mode == "environment" {
		t.Setenv("HTTPS_PROXY", proxy.URL)
		t.Setenv("https_proxy", "")
		t.Setenv("NO_PROXY", "")
		t.Setenv("no_proxy", "")
		// Without auth.proxy, the proxy CA is provided through the issuer bundle.
		writeCA(t, issuerPath, append(issuerCA, proxyCA...))
		config = nil
	}
	clients, err := New(issuerPath, "", config)
	require.NoError(t, err)
	t.Cleanup(clients.Issuer.CloseIdleConnections)
	client := clients.Issuer
	t.Logf("mode=%s proxy h2=%t", mode, h2)
	for _, stage := range []string{"initial", "after CA reload"} {
		response, err := client.Get("https://issuer.example.test/.well-known/openid-configuration")
		require.NoError(t, err, stage)
		require.Equal(t, http.StatusOK, response.StatusCode)
		require.NoError(t, response.Body.Close())
		if stage == "initial" {
			// Change the issuer bundle to force an actual transport rebuild.
			current, err := os.ReadFile(issuerPath)
			require.NoError(t, err)
			extraCA, _ := testCA(t)
			writeCA(t, issuerPath, append(current, extraCA...))
			require.NoError(t, clients.providers[0].RunOnce(t.Context()))
			require.Same(t, client, clients.Issuer)
		}
	}
	require.EqualValues(t, 2, connects.Load())
}

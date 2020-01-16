package server

import (
	"fmt"
	"github.com/coreos/pkg/capnslog"
	"net/http"
)

var (
	slog = capnslog.NewPackageLogger("github.com/openshift/console", "server")
)

// The oauth health endpoint is the proxy we will use for "console can connect to oauth"
// It will work as follows:
//   operator -> console /health 200 ok (console ok)
//   operator -> console /health 400 not found (console not ok)
//   operator -> console /health/oauth 200 ok (oauth connect ok)
//   operator -> console /health/oauth 400 not found (oauth connect not ok. note that console /health already 200 ok)
//   etc.
// This means that if console /health is ok, but oauth /healtz is not, we can deduce
//   which route is broken (or potentially that the route is fine but the pod crashed).
// It is not the job of the console to provide reasons for the failure to connect, the
//   oauth server itself will provide its own status.  The console simply needs to report
//   back on success or failure so that the console-operator can report its own status.
func (s *Server) OAuthConnect(writer http.ResponseWriter, req *http.Request) {
	issuer := s.Auther.GetSpecialURLs().Issuer
	health := issuer + "/healthz"

	oauthReq, err := http.NewRequest(http.MethodGet, health, nil)
	oauthResp, err := s.K8sClient.Do(oauthReq)
	_, err = s.K8sClient.Do(oauthReq)
	if err != nil {
		fmt.Fprintf(writer, "error, %v", err)
	}
	// not using the body.
	// defer oauthResp.Body.Close()

	writer.WriteHeader(oauthResp.StatusCode)
	slog.Infof("oauth connect health check: %v", oauthResp.Status)
	fmt.Fprintf(writer, "%v", oauthResp.Status)
}


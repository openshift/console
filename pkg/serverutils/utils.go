package serverutils

import (
	"encoding/json"
	"net/http"
	"strings"

	"k8s.io/klog"
)

const LocalClusterName = "local-cluster"

func GetCluster(r *http.Request) string {
	// The client can't set headers for WebSockets, so check both the header and query
	// parameters for the active cluster.
	cluster := r.Header.Get("X-Cluster")
	if len(cluster) != 0 {
		return cluster
	}
	cluster = r.URL.Query().Get("cluster")
	if len(cluster) != 0 {
		return cluster
	}
	return LocalClusterName
}

// Copied from Server package to maintain error response consistency
func SendResponse(rw http.ResponseWriter, code int, resp interface{}) {
	enc, err := json.Marshal(resp)
	if err != nil {
		klog.Errorf("Failed JSON-encoding HTTP response: %v", err)
		rw.WriteHeader(http.StatusInternalServerError)
		return
	}

	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(code)

	_, err = rw.Write(enc)
	if err != nil {
		klog.Errorf("Failed sending HTTP response body: %v", err)
	}
}

func IsUnsupportedBrowser(r *http.Request) bool {
	userAgentHeader := r.Header.Get("User-Agent")
	isUnsupported := false
	unsupportedBrowserHeadersIdentifier := []string{
		"Trident/", // IE 11
		"MSIE ",    // IE 10 or older
	}
	for _, identifier := range unsupportedBrowserHeadersIdentifier {
		if strings.Contains(userAgentHeader, identifier) {
			isUnsupported = true
			break
		}
	}
	return isUnsupported
}

func SendUnsupportedBrowserResponse(rw http.ResponseWriter, brand string) {
	content := `<p>Internet Explorer 11 and earlier are not supported, and the ` + brand + ` console will not function with your current browser.
Please use a supported browser such as the latest version of Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari.
The current Firefox ESR (Extended Support Release) is also supported. To see the browsers we test, refer to the
<a href="https://access.redhat.com/articles/4763741">OpenShift Container Platform 4.x Tested Integrations (for x86_x64)</a>.</p>`
	rw.Header().Set("Content-Type", "text/html")
	rw.WriteHeader(http.StatusFailedDependency)
	rw.Write([]byte(content))
}

type ApiError struct {
	Err string `json:"error"`
}

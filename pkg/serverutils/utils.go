package serverutils

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"k8s.io/klog/v2"
)

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

// ModifiedSince checks if the last modified time is after the If-Modified-Since time in the request
// header.
// If the last modified time is nil, returns true.
// If the If-Modified-Since header is not present, returns true.
// If the If-Modified-Since header is present but not a valid time, returns an error.
// If the last modified time is after the if modified since time, returns true.
// If the last modified time is before the if modified since time, returns false.
func ModifiedSince(r *http.Request, lastModified string) (bool, error) {
	klog.V(4).Infof("%v %v, checking if modified since %v", r.Method, r.URL.String(), lastModified)
	if lastModified == "" {
		return true, nil
	}

	ifModifiedSince := r.Header.Get("If-Modified-Since")
	if ifModifiedSince == "" {
		return true, nil
	}

	ifModifiedSinceTime, err := time.Parse(http.TimeFormat, ifModifiedSince)
	if err != nil {
		return true, err
	}

	lastModifiedTime, err := time.Parse(http.TimeFormat, lastModified)
	if err != nil {
		return true, err
	}

	return lastModifiedTime.After(ifModifiedSinceTime), nil
}

type ApiError struct {
	Err string `json:"error"`
}

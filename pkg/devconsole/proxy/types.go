package proxy

import (
	"net/http"
	"net/url"
)

type ProxyRequest struct {
	AllowInsecure bool        `json:"allowInsecure,omitempty"`
	Method        string      `json:"method"`
	Url           string      `json:"url"`
	Headers       http.Header `json:"headers"`
	Queryparams   url.Values  `json:"queryparams"`
	Body          string      `json:"body"`
}

type ProxyResponse struct {
	StatusCode int         `json:"statusCode"`
	Headers    http.Header `json:"headers"`
	Body       string      `json:"body"`
}

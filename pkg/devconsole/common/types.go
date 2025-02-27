package common

import "net/http"

type DevConsoleCommonRequest struct {
	AllowAuthHeader bool `json:"allowAuthHeader,omitempty"`
}
type DevConsoleCommonResponse struct {
	StatusCode int         `json:"statusCode"`
	Headers    http.Header `json:"headers"`
	Body       string      `json:"body"`
}

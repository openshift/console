package handlers

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/openshift/console/pkg/auth"
	"helm.sh/helm/v3/pkg/action"
)

var fakeReportSummary = `{"passed":"0","failed":"0","messages":null}`

const validChartURL = "https://example.com/charts/mychart-1.0.0.tgz"

func fakeVerifierHandler() verifierHandlers {
	return verifierHandlers{
		getActionConfigurations: getFakeActionConfigurations,
	}
}

func fakeChartVerification(reportSummary string, err error) func(chartUrl string, values map[string]interface{}, conf *action.Configuration) (string, error) {
	return func(chartUrl string, values map[string]interface{}, conf *action.Configuration) (r string, er error) {
		return reportSummary, err
	}
}
func TestHelmHandlers_HandleChartVerifier(t *testing.T) {
	validBody := `{"chart_url":"` + validChartURL + `"}`

	tests := []struct {
		name             string
		body             string
		expectedResponse string
		ReportSummary    string
		error
		httpStatusCode int
	}{
		{
			name:             "Error occurred",
			body:             validBody,
			expectedResponse: `{"error":"Failed to verify chart: Chart path is invalid"}`,
			error:            errors.New("Chart path is invalid"),
			httpStatusCode:   http.StatusBadGateway,
		},
		{
			name:             "Successful chart verification",
			body:             validBody,
			ReportSummary:    fakeReportSummary,
			httpStatusCode:   http.StatusOK,
			expectedResponse: fakeReportSummary,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handlers := fakeVerifierHandler()
			handlers.chartVerifier = fakeChartVerification(tt.ReportSummary, tt.error)

			request := httptest.NewRequest("", "/foo", strings.NewReader(tt.body))
			response := httptest.NewRecorder()

			handlers.HandleChartVerifier(&auth.User{}, response, request)
			if response.Code != tt.httpStatusCode {
				t.Errorf("response code should be %v but got %v", tt.httpStatusCode, response.Code)
			}
			if response.Header().Get("Content-Type") != "application/json" {
				t.Errorf("content type should be application/json but got %s", response.Header().Get("Content-Type"))
			}
			if response.Body.String() != tt.expectedResponse {
				t.Errorf("response body not matching expected is %s and received is %s", tt.expectedResponse, response.Body.String())
			}
		})
	}
}

func TestHelmHandlers_HandleChartVerifier_AcceptsValidURLs(t *testing.T) {
	tests := []struct {
		name string
		url  string
	}{
		{"valid OCI registry", "oci://ghcr.io/charts/mychart:1.0.0"},
		{"valid OCI registry with port", "oci://registry.example.com:5000/charts/mychart"},
		{"valid HTTPS tgz", validChartURL},
		{"valid HTTP tgz", "http://example.com/charts/mychart-1.0.0.tgz"},
		{"valid HTTPS tar.gz", "https://example.com/charts/mychart-1.0.0.tar.gz"},
		{"valid HTTP IPv4 tgz", "http://172.28.1.76:8849/chart.tgz"},
		{"valid HTTP localhost tgz", "http://localhost/chart.tgz"},
		{"valid HTTP loopback tgz", "http://127.0.0.1/chart.tgz"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handlers := fakeVerifierHandler()
			actionConfigCalled := false
			verifierCalled := false
			handlers.getActionConfigurations = func(string, string, string, *http.RoundTripper) *action.Configuration {
				actionConfigCalled = true
				return &action.Configuration{}
			}
			handlers.chartVerifier = func(chartURL string, values map[string]interface{}, conf *action.Configuration) (string, error) {
				verifierCalled = true
				return fakeReportSummary, nil
			}

			request := httptest.NewRequest(http.MethodPost, "/api/helm/verify", strings.NewReader(`{"chart_url":"`+tt.url+`"}`))
			response := httptest.NewRecorder()

			handlers.HandleChartVerifier(&auth.User{}, response, request)

			if response.Code != http.StatusOK {
				t.Errorf("expected status 200 but got %v", response.Code)
			}
			if !actionConfigCalled {
				t.Error("expected action configuration to be created")
			}
			if !verifierCalled {
				t.Error("expected chart verifier to be called")
			}
		})
	}
}

func TestHelmHandlers_HandleChartVerifier_RejectsInvalidURLs(t *testing.T) {
	tests := []struct {
		name string
		body string
	}{
		{"rejects internal IP without tgz", `{"chart_url":"http://172.28.1.76:8849/nacos"}`},
		{"rejects non-tgz HTTP URL", `{"chart_url":"http://example.com/charts/mychart"}`},
		{"rejects empty chart URL", `{"chart_url":""}`},
		{"rejects hostless OCI URL", `{"chart_url":"oci:///chart"}`},
		{"rejects ftp scheme", `{"chart_url":"ftp://example.com/chart.tgz"}`},
		{"rejects file scheme", `{"chart_url":"file:///etc/passwd"}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handlers := fakeVerifierHandler()
			actionConfigCalled := false
			verifierCalled := false
			handlers.getActionConfigurations = func(string, string, string, *http.RoundTripper) *action.Configuration {
				actionConfigCalled = true
				return &action.Configuration{}
			}
			handlers.chartVerifier = func(chartURL string, values map[string]interface{}, conf *action.Configuration) (string, error) {
				verifierCalled = true
				return fakeReportSummary, nil
			}

			request := httptest.NewRequest(http.MethodPost, "/api/helm/verify", strings.NewReader(tt.body))
			response := httptest.NewRecorder()

			handlers.HandleChartVerifier(&auth.User{}, response, request)

			if response.Code != http.StatusBadRequest {
				t.Errorf("expected status 400 but got %v", response.Code)
			}
			if response.Body.String() != `{"error":"invalid chart URL: must be oci:// or http(s)://*.tgz"}` {
				t.Errorf("unexpected response body: %s", response.Body.String())
			}
			if actionConfigCalled {
				t.Error("did not expect action configuration to be created")
			}
			if verifierCalled {
				t.Error("did not expect chart verifier to be called")
			}
		})
	}
}

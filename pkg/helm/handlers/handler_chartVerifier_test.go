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

func fakeVerifierHandler() verifierHandlers {
	return verifierHandlers{
		getActionConfigurations: getFakeActionConfigurations,
	}
}

func fakeChartVerification(reportSummary string, err error) func(chartUrl string, values map[string]interface{}, conf *action.Configuration) (string, error) {
	return func(chartUrl string, values map[string]interface{}, conf *action.Configuration) (r string, er error) {
		return r, err
	}
}
func TestHelmHandlers_HandleChartVerifier(t *testing.T) {
	tests := []struct {
		name             string
		expectedResponse string
		ReportSummary    string
		error
		httpStatusCode int
	}{
		{
			name:             "Error occurred",
			expectedResponse: `{"error":"Failed to verify chart: Chart path is invalid"}`,
			error:            errors.New("Chart path is invalid"),
			httpStatusCode:   http.StatusBadGateway,
		},
		{
			name:             "Successful chart verification",
			ReportSummary:    fakeReportSummary,
			httpStatusCode:   http.StatusOK,
			expectedResponse: ``,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handlers := fakeVerifierHandler()
			handlers.chartVerifier = fakeChartVerification(tt.ReportSummary, tt.error)

			request := httptest.NewRequest("", "/foo", strings.NewReader("{}"))
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

package handlers

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/release"

	"github.com/openshift/console/pkg/auth"
)

var fakeReleaseList = []*release.Release{
	{
		Name: "Test",
	},
}

var fakeRelease = release.Release{
	Name: "Test",
}

var fakeReleaseManifest = "manifest-data"

func fakeHelmHandler() helmHandlers {
	return helmHandlers{
		getActionConfigurations: getFakeActionConfigurations,
	}
}

func fakeInstallChart(mockedRelease *release.Release, err error) func(ns string, name string, url string, values map[string]interface{}, conf *action.Configuration) (*release.Release, error) {
	return func(ns string, name string, url string, values map[string]interface{}, conf *action.Configuration) (r *release.Release, er error) {
		return mockedRelease, err
	}
}

func fakeListReleases(mockedReleases []*release.Release, err error) func(conf *action.Configuration) ([]*release.Release, error) {
	return func(conf *action.Configuration) (releases []*release.Release, er error) {
		return mockedReleases, err
	}
}

func fakeGetManifest(mockedManifest string, err error) func(name string, url string, values map[string]interface{}, conf *action.Configuration) (string, error) {
	return func(name string, url string, values map[string]interface{}, conf *action.Configuration) (r string, er error) {
		return mockedManifest, err
	}
}

func getFakeActionConfigurations(string, string, string, *http.RoundTripper) *action.Configuration {
	return &action.Configuration{}
}

func TestHelmHandlers_HandleHelmList(t *testing.T) {
	tests := []struct {
		name             string
		expectedResponse string
		releaseList      []*release.Release
		error
		httpStatusCode int
	}{
		{
			name:             "Error occurred at listing releases",
			error:            errors.New("unknown error occurred"),
			httpStatusCode:   http.StatusBadGateway,
			expectedResponse: `{"error":"Failed to list helm releases: unknown error occurred"}`,
		},
		{
			name:             "Return releases serialized in JSON format",
			expectedResponse: `[{"name":"Test"}]`,
			releaseList:      fakeReleaseList,
			httpStatusCode:   http.StatusOK,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handlers := fakeHelmHandler()
			handlers.listReleases = fakeListReleases(tt.releaseList, tt.error)

			request := httptest.NewRequest("", "/foo", strings.NewReader("{}"))
			response := httptest.NewRecorder()

			handlers.HandleHelmList(&auth.User{}, response, request)
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

func TestHelmHandlers_HandleHelmInstall(t *testing.T) {
	tests := []struct {
		name             string
		expectedResponse string
		installedRelease release.Release
		error
		httpStatusCode int
	}{
		{
			name:             "Error occurred",
			expectedResponse: `{"error":"Failed to install helm chart: Chart path is invalid"}`,
			error:            errors.New("Chart path is invalid"),
			httpStatusCode:   http.StatusBadGateway,
		},
		{
			name:             "Successful install returns release info in JSON format",
			installedRelease: fakeRelease,
			httpStatusCode:   http.StatusOK,
			expectedResponse: `{"name":"Test"}`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handlers := fakeHelmHandler()
			handlers.installChart = fakeInstallChart(&tt.installedRelease, tt.error)

			request := httptest.NewRequest("", "/foo", strings.NewReader("{}"))
			response := httptest.NewRecorder()

			handlers.HandleHelmInstall(&auth.User{}, response, request)
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

func TestHelmHandlers_HandleHelmRenderManifest(t *testing.T) {
	tests := []struct {
		name                string
		expectedResponse    string
		expectedManifest    string
		expectedContentType string
		error
		httpStatusCode int
	}{
		{
			name:                "Error occurred",
			error:               errors.New("Chart path is invalid"),
			expectedResponse:    `{"error":"Failed to render manifests: Chart path is invalid"}`,
			httpStatusCode:      http.StatusBadGateway,
			expectedContentType: "application/json",
		},
		{
			name:                "Return manifest in yaml format",
			expectedResponse:    fakeReleaseManifest,
			expectedManifest:    fakeReleaseManifest,
			httpStatusCode:      http.StatusOK,
			expectedContentType: "text/yaml",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handlers := fakeHelmHandler()
			handlers.renderManifests = fakeGetManifest(tt.expectedManifest, tt.error)

			request := httptest.NewRequest("", "/foo", strings.NewReader("{}"))
			response := httptest.NewRecorder()

			handlers.HandleHelmRenderManifests(&auth.User{}, response, request)

			if response.Code != tt.httpStatusCode {
				t.Errorf("response code should be %v but got %v", tt.httpStatusCode, response.Code)
			}
			if response.Header().Get("Content-Type") != tt.expectedContentType {
				t.Errorf("content type should be %s but got %s", tt.expectedContentType, response.Header().Get("Content-Type"))
			}
			if response.Body.String() != tt.expectedResponse {
				t.Errorf("response body not matching expected is %s and received is %s", tt.expectedResponse, response.Body.String())
			}

		})
	}
}

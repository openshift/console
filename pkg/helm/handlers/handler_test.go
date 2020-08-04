package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/release"
	"helm.sh/helm/v3/pkg/repo"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/dynamic/fake"
	corev1 "k8s.io/client-go/kubernetes/typed/core/v1"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/yaml"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/helm/actions"
	"github.com/openshift/console/pkg/helm/chartproxy"
)

var fakeReleaseList = []*release.Release{
	{
		Name: "Test",
	},
}

var fakeReleaseHistory = []*release.Release{
	{
		Name:    "test",
		Version: 1,
	},
	{
		Name:    "test",
		Version: 2,
	},
}

var fakeRelease = release.Release{
	Name: "Test",
}

var fakeUninstallResponse = &release.UninstallReleaseResponse{
	Release: &fakeRelease,
	Info:    "",
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

func fakeGetRelease(name string, t *testing.T, mockedRelease *release.Release, err error) func(releaseName string, conf *action.Configuration) (*release.Release, error) {
	return func(releaseName string, conf *action.Configuration) (r *release.Release, er error) {
		if name != releaseName {
			t.Errorf("release name mismatch expected is %s, received %s", name, releaseName)
		}
		return mockedRelease, err
	}
}

func mockedHelmGetChart(c *chart.Chart, e error) func(url string, conf *action.Configuration) (*chart.Chart, error) {
	return func(url string, conf *action.Configuration) (*chart.Chart, error) {
		return c, e
	}
}

func fakeGetReleaseHistory(name string, fakeHistory []*release.Release, t *testing.T, err error) func(name string, conf *action.Configuration) ([]*release.Release, error) {
	return func(n string, conf *action.Configuration) ([]*release.Release, error) {
		if name != n {
			t.Errorf("release name mismatch expected is %s, received %s", n, name)
		}
		return fakeHistory, err
	}
}

func fakeUninstallRelease(name string, t *testing.T, fakeResp *release.UninstallReleaseResponse, err error) func(name string, conf *action.Configuration) (*release.UninstallReleaseResponse, error) {
	return func(n string, conf *action.Configuration) (*release.UninstallReleaseResponse, error) {
		if n != name {
			t.Errorf("release name mismatch expected is %s, received %s", n, name)
		}
		return fakeResp, err
	}
}

func fakeUpgradeRelease(name, ns string, t *testing.T, fakeRelease *release.Release, err error) func(ns, name, url string, vals map[string]interface{}, conf *action.Configuration) (*release.Release, error) {
	return func(namespace, n, url string, vals map[string]interface{}, conf *action.Configuration) (*release.Release, error) {
		if namespace != ns {
			t.Errorf("Namespace mismatch expected %s received %s", ns, namespace)
		}
		if name != n {
			t.Errorf("Name mismatch expected %s received %s", name, n)
		}
		return fakeRelease, err
	}
}

func fakeRollbackRelease(name string, t *testing.T, rel *release.Release, err error) func(name string, revision int, conf *action.Configuration) (*release.Release, error) {
	return func(n string, revision int, conf *action.Configuration) (*release.Release, error) {
		if name != n {
			t.Errorf("Release name mismatch expected is %s and received %s", name, n)
		}
		return rel, err
	}
}

func fakeHelmGetChartRepos(indexFile *repo.IndexFile, err error) func(c dynamic.Interface, coreClient corev1.CoreV1Interface, caCert []byte) (*repo.IndexFile, error) {
	return func(c dynamic.Interface, coreClient corev1.CoreV1Interface, caCerts []byte) (*repo.IndexFile, error) {
		return indexFile, err
	}
}

func fakeDynamicClient(err error) func(conf *rest.Config) (dynamic.Interface, error) {
	return func(conf *rest.Config) (dynamic.Interface, error) {
		return fake.NewSimpleDynamicClient(runtime.NewScheme()), err
	}
}

type fakeProxy struct {
	repo *repo.IndexFile
	chartproxy.Proxy
	error
}

func (p fakeProxy) IndexFile() (*repo.IndexFile, error) {
	return p.repo, p.error
}

type FakeConfig struct {
	action.RESTClientGetter
}

func (f FakeConfig) ToRESTConfig() (config *rest.Config, err error) {
	return &rest.Config{}, nil
}

func getFakeActionConfigurations(string, string, string, *http.RoundTripper) *action.Configuration {
	return &action.Configuration{
		RESTClientGetter: FakeConfig{},
	}
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

func TestHelmHandlers_HandleGetRelease(t *testing.T) {
	tests := []struct {
		name             string
		expectedResponse string
		release          *release.Release
		releaseName      string
		error
		httpStatusCode int
	}{
		{
			name:             "Error occurred at finding release",
			error:            errors.New("unknown error occurred"),
			httpStatusCode:   http.StatusBadGateway,
			releaseName:      "Test",
			expectedResponse: `{"error":"Failed to find helm release: unknown error occurred"}`,
		},
		{
			name:             "Return the requested release serialized in JSON format",
			expectedResponse: `{"name":"Test"}`,
			release:          &fakeRelease,
			releaseName:      "Test",
			httpStatusCode:   http.StatusOK,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handlers := fakeHelmHandler()
			handlers.getRelease = fakeGetRelease(tt.releaseName, t, tt.release, tt.error)

			request := httptest.NewRequest("", "/foo?name="+tt.releaseName, strings.NewReader("{}"))
			response := httptest.NewRecorder()

			handlers.HandleGetRelease(&auth.User{}, response, request)

			if response.Code != tt.httpStatusCode {
				t.Errorf("response code should be %v but got %v", tt.httpStatusCode, response.Code)
			}
			if response.Body.String() != tt.expectedResponse {
				t.Errorf("response body not matching expected is %s and received is %s", tt.expectedResponse, response.Body.String())
			}

		})
	}
}

func TestHelmHandlers_HandleGetChart(t *testing.T) {
	tests := []struct {
		name                string
		expectedResponse    string
		expectedChart       chart.Chart
		expectedContentType string
		error
		httpStatusCode int
	}{
		{
			name:                "Error occurred",
			error:               errors.New("Chart path is invalid"),
			expectedResponse:    `{"error":"Failed to retrieve chart: Chart path is invalid"}`,
			httpStatusCode:      http.StatusBadRequest,
			expectedContentType: "application/json",
		},
		{
			name:             "Return chart info in json format",
			expectedResponse: `{"metadata":{"name":"foo"},"lock":null,"templates":null,"values":null,"schema":null,"files":null}`,
			expectedChart: chart.Chart{
				Metadata: &chart.Metadata{
					Name: "foo",
				},
			},
			httpStatusCode:      http.StatusOK,
			expectedContentType: "application/json",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handlers := fakeHelmHandler()
			handlers.getChart = mockedHelmGetChart(&tt.expectedChart, tt.error)

			request := httptest.NewRequest("", "/foo", strings.NewReader("{}"))
			response := httptest.NewRecorder()

			handlers.HandleChartGet(&auth.User{}, response, request)

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

func TestHelmHandlers_HandleGetReleaseHistory(t *testing.T) {
	tests := []struct {
		name                string
		expectedResponse    string
		history             []*release.Release
		expectedContentType string
		error
		httpStatusCode int
		releaseName    string
	}{
		{
			name:                "chart release history should error out when there is error from helm",
			error:               errors.New("Chart path is invalid"),
			expectedResponse:    `{"error":"Failed to list helm release history: Chart path is invalid"}`,
			httpStatusCode:      http.StatusBadGateway,
			expectedContentType: "application/json",
			releaseName:         "test",
		},
		{
			name:                "Get successful release history",
			expectedResponse:    `[{"name":"test","version":1},{"name":"test","version":2}]`,
			history:             fakeReleaseHistory,
			httpStatusCode:      http.StatusOK,
			expectedContentType: "application/json",
			releaseName:         "test",
		},
		{
			name:                "NotFound error should be returned if release does not exist",
			error:               actions.ErrReleaseNotFound,
			expectedResponse:    `{"error":"Failed to list helm release history: release: not found"}`,
			httpStatusCode:      http.StatusNotFound,
			expectedContentType: "application/json",
			releaseName:         "test",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handlers := fakeHelmHandler()
			handlers.getReleaseHistory = fakeGetReleaseHistory(tt.releaseName, tt.history, t, tt.error)

			request := httptest.NewRequest("", "/foo?name="+tt.releaseName, strings.NewReader(`{}`))
			response := httptest.NewRecorder()

			handlers.HandleGetReleaseHistory(&auth.User{}, response, request)

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

func TestHelmHandlers_HandleHelmUninstallRelease(t *testing.T) {
	tests := []struct {
		name                string
		expectedResponse    string
		uninstallResponse   *release.UninstallReleaseResponse
		expectedContentType string
		releaseName         string
		releaseNamespace    string
		error
		httpStatusCode int
	}{
		{
			name:                "Invalid chart uninstall release test",
			error:               errors.New("Chart path is invalid"),
			expectedResponse:    `{"error":"Failed to uninstall helm release: Chart path is invalid"}`,
			httpStatusCode:      http.StatusBadGateway,
			expectedContentType: "application/json",
			releaseName:         "test",
			releaseNamespace:    "test-namespace",
		},
		{
			name:                "Valid chart uninstall release test",
			expectedResponse:    `{"release":{"name":"Test"}}`,
			uninstallResponse:   fakeUninstallResponse,
			httpStatusCode:      http.StatusOK,
			expectedContentType: "application/json",
			releaseName:         "test",
			releaseNamespace:    "test-namespace",
		},
		{
			name:                "uninstalling non exist release should return not found",
			error:               actions.ErrReleaseNotFound,
			expectedResponse:    `{"error":"Failed to uninstall helm release: release: not found"}`,
			httpStatusCode:      http.StatusNotFound,
			expectedContentType: "application/json",
			releaseName:         "test",
			releaseNamespace:    "test-namespace",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handlers := fakeHelmHandler()
			handlers.uninstallRelease = fakeUninstallRelease(tt.releaseName, t, tt.uninstallResponse, tt.error)

			request := httptest.NewRequest("", fmt.Sprintf("/foo?name=%s&ns=%s", tt.releaseName, tt.releaseNamespace), strings.NewReader("{}"))
			response := httptest.NewRecorder()

			handlers.HandleUninstallRelease(&auth.User{}, response, request)

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

func TestHelmHandlers_HandleHelmRollbackRelease(t *testing.T) {
	tests := []struct {
		name                string
		expectedResponse    string
		release             *release.Release
		expectedContentType string
		body                string
		releaseName         string
		releaseNamespace    string
		error
		httpStatusCode int
	}{
		{
			name:                "Invalid chart rollback release test",
			error:               errors.New("Chart path is invalid"),
			body:                `{"name": "test", "namespace":"test", "version":1}`,
			expectedResponse:    `{"error":"Failed to rollback helm releases: Chart path is invalid"}`,
			httpStatusCode:      http.StatusBadGateway,
			expectedContentType: "application/json",
			releaseName:         "test",
			releaseNamespace:    "test",
		},
		{
			name:             "Valid chart rollback release test",
			expectedResponse: `{"name":"test-release","info":{"first_deployed":"","last_deployed":"","deleted":"","status":"deployed"},"version":1}`,
			body:             `{"name": "test", "namespace":"test", "version":1}`,
			release: &release.Release{
				Name: "test-release",
				Info: &release.Info{
					Status: release.StatusDeployed,
				},
				Version: 1,
			},
			expectedContentType: "application/json",
			error:               nil,
			httpStatusCode:      http.StatusOK,
			releaseName:         "test",
			releaseNamespace:    "test",
		},
		{
			name:                "Invalid body in the request should throw an json parsing error",
			expectedResponse:    `{"error":"Failed to parse request: json: cannot unmarshal string into Go struct field HelmRequest.version of type int"}`,
			body:                `{"name": "test", "namespace":"test", "version":"abc"}`,
			expectedContentType: "application/json",
			error:               errors.New(`{"error":"Failed to parse request: json: cannot unmarshal string into Go struct field HelmRequest.version of type int"}`),
			httpStatusCode:      http.StatusBadGateway,
			releaseName:         "test",
			releaseNamespace:    "test",
		},
		{
			name:                "Non exist release rollback should return revision not found error",
			error:               actions.ErrReleaseRevisionNotFound,
			body:                `{"name": "test", "namespace":"test", "version":1}`,
			expectedResponse:    `{"error":"Failed to rollback helm releases: revision not found for provided release"}`,
			httpStatusCode:      http.StatusNotFound,
			expectedContentType: "application/json",
			releaseName:         "test",
			releaseNamespace:    "test",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handlers := fakeHelmHandler()
			var request *http.Request

			handlers.rollbackRelease = fakeRollbackRelease(tt.releaseName, t, tt.release, tt.error)

			request = httptest.NewRequest("", "/foo", strings.NewReader(tt.body))
			response := httptest.NewRecorder()

			handlers.HandleRollbackRelease(&auth.User{}, response, request)

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

func TestHelmHandlers_HandleHelmUpgradeRelease(t *testing.T) {
	tests := []struct {
		name                string
		expectedResponse    string
		expectedContentType string
		release             *release.Release
		error
		httpStatusCode  int
		requestBody     string
		releaseName     string
		releaseNamepace string
	}{
		{
			name:                "Invalid chart path upgrade release test",
			error:               errors.New("Chart path is invalid"),
			expectedResponse:    `{"error":"Failed to upgrade helm release: Chart path is invalid"}`,
			httpStatusCode:      http.StatusBadGateway,
			expectedContentType: "application/json",
			requestBody:         `{"name":"test", "namespace": "test-namespace", "version": 1}`,
			releaseName:         "test",
			releaseNamepace:     "test-namespace",
		},
		{
			name:                "Valid chart upgrade release",
			expectedResponse:    `{"name":"Test"}`,
			release:             &fakeRelease,
			expectedContentType: "application/json",
			error:               nil,
			httpStatusCode:      http.StatusOK,
			requestBody:         `{"name":"test", "namespace": "test-namespace"}`,
			releaseName:         "test",
			releaseNamepace:     "test-namespace",
		},
		{
			name:                "Upgrade of non exist release should return no revision found error",
			expectedResponse:    `{"error":"Failed to rollback helm releases: revision not found for provided release"}`,
			release:             &fakeRelease,
			expectedContentType: "application/json",
			error:               actions.ErrReleaseRevisionNotFound,
			httpStatusCode:      http.StatusNotFound,
			requestBody:         `{"name":"test", "namespace": "test-namespace"}`,
			releaseName:         "test",
			releaseNamepace:     "test-namespace",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handlers := fakeHelmHandler()
			var request *http.Request

			handlers.upgradeRelease = fakeUpgradeRelease(tt.releaseName, tt.releaseNamepace, t, tt.release, tt.error)

			request = httptest.NewRequest("", "/foo", strings.NewReader(tt.requestBody))

			response := httptest.NewRecorder()

			handlers.HandleUpgradeRelease(&auth.User{}, response, request)

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

func TestHelmHandlers_Index(t *testing.T) {
	tests := []struct {
		name             string
		indexFile        *repo.IndexFile
		httpStatusCode   int
		proxyNewError    error
		indexFileError   error
		expectedResponse string
	}{
		{
			name:           "valid repo index file should return correct response",
			httpStatusCode: http.StatusOK,
			indexFile: &repo.IndexFile{
				APIVersion: "v1",
				Entries: map[string]repo.ChartVersions{
					"redhat-chart": {
						{
							Metadata: &chart.Metadata{
								Name:       "redhat-chart",
								Version:    "v1.0.0",
								APIVersion: "v1",
							},
							URLs: []string{"https://redhat-chart.url.com"},
						},
					},
				},
			},
		},
		{
			name:             "error case should return correct http header",
			httpStatusCode:   http.StatusInternalServerError,
			proxyNewError:    errors.New("Fake error"),
			expectedResponse: `{"error":"Failed to get k8s config: Fake error"}`,
		},
		{
			name:             "Report error while retrieving the merged index",
			httpStatusCode:   http.StatusInternalServerError,
			indexFileError:   errors.New("Fake error"),
			expectedResponse: `{"error":"Failed to get index file: Fake error"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var request *http.Request

			request = httptest.NewRequest(http.MethodGet, "/api/helm/charts/index.yaml", strings.NewReader(""))
			response := httptest.NewRecorder()

			handler := indexHandler{
				newProxy: func() (proxy chartproxy.Proxy, err error) {
					return &fakeProxy{repo: tt.indexFile, error: tt.indexFileError}, tt.proxyNewError
				},
			}

			handler.ServeHTTP(response, request)

			if tt.expectedResponse == "" && tt.indexFile != nil {
				expectedResponse, err := yaml.Marshal(tt.indexFile)
				tt.expectedResponse = string(expectedResponse)
				if err != nil {
					t.Error(err)
				}
			}

			if tt.expectedResponse != response.Body.String() {
				t.Errorf("Expected response isn't matching expected \n %s received \n %s", tt.expectedResponse, response.Body.String())
			}

			if response.Code != tt.httpStatusCode {
				t.Errorf("Response status code isn't matching expected %d recieved %d", tt.httpStatusCode, response.Code)
			}

			if tt.expectedResponse != "" && tt.expectedResponse != response.Body.String() {
				t.Errorf("Response not matching expected is %s and received %s", tt.expectedResponse, response.Body.String())
			}
		})
	}
}

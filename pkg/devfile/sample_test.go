package devfile

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"path"
	"strings"
	"testing"

	"github.com/devfile/registry-support/index/generator/schema"
)

func TestGetRegistrySamples(t *testing.T) {
	tests := []struct {
		name            string
		registryFolder  string
		registryServer  string
		expectedSamples []schema.Schema
		expectedError   error
	}{
		{
			// curl https://registry.stage.devfile.io/index/sample -o pkg/devfile/testdata/registrystagedevfileio/sample.json
			name:           "Fetch samples from mock registry server",
			registryFolder: "testdata/registrystagedevfileio",
			expectedSamples: []schema.Schema{
				{
					Name:        "nodejs-basic",
					DisplayName: "Basic Node.js",
					Description: "A simple Hello World Node.js application",
					Tags:        []string{"NodeJS", "Express"},
					Icon:        "https://nodejs.org/static/images/logos/nodejs-new-pantone-black.svg",
					Type:        schema.SampleDevfileType,
					ProjectType: "nodejs",
					Language:    "nodejs",
					Provider:    "Red Hat",
					Git: &schema.Git{
						Remotes: map[string]string{
							"origin": "https://github.com/nodeshift-starters/devfile-sample.git",
						},
					},
				},
				{
					Name:        "code-with-quarkus",
					DisplayName: "Basic Quarkus",
					Description: "A simple Hello World Java application using Quarkus",
					Tags:        []string{"Java", "Quarkus"},
					Icon:        "https://design.jboss.org/quarkus/logo/final/SVG/quarkus_icon_rgb_default.svg",
					Type:        schema.SampleDevfileType,
					ProjectType: "quarkus",
					Language:    "java",
					Provider:    "Red Hat",
					Git: &schema.Git{
						Remotes: map[string]string{
							"origin": "https://github.com/devfile-samples/devfile-sample-code-with-quarkus.git",
						},
					},
				},
				{
					Name:        "java-springboot-basic",
					DisplayName: "Basic Spring Boot",
					Description: "A simple Hello World Java Spring Boot application using Maven",
					Tags:        []string{"Java", "Spring"},
					Icon:        "https://spring.io/images/projects/spring-edf462fec682b9d48cf628eaf9e19521.svg",
					Type:        schema.SampleDevfileType,
					ProjectType: "springboot",
					Language:    "java",
					Provider:    "Red Hat",
					Git: &schema.Git{
						Remotes: map[string]string{
							"origin": "https://github.com/devfile-samples/devfile-sample-java-springboot-basic.git",
						},
					},
				},
				{
					Name:        "python-basic",
					DisplayName: "Basic Python",
					Description: "A simple Hello World application using Python",
					Tags:        []string{"Python"},
					Icon:        "https://raw.githubusercontent.com/devfile-samples/devfile-stack-icons/main/python.svg",
					Type:        schema.SampleDevfileType,
					ProjectType: "python",
					Language:    "python",
					Provider:    "Red Hat",
					Git: &schema.Git{
						Remotes: map[string]string{
							"origin": "https://github.com/devfile-samples/devfile-sample-python-basic.git",
						},
					},
				},
				{
					Name:        "go-basic",
					DisplayName: "Basic Go",
					Description: "A simple Hello World application using Go",
					Tags:        []string{"Go"},
					Icon:        "https://go.dev/blog/go-brand/Go-Logo/SVG/Go-Logo_Blue.svg",
					Type:        schema.SampleDevfileType,
					ProjectType: "go",
					Language:    "go",
					Provider:    "Red Hat",
					Git: &schema.Git{
						Remotes: map[string]string{
							"origin": "https://github.com/devfile-samples/devfile-sample-go-basic.git",
						},
					},
				},
				{
					Name:        "dotnet60-basic",
					DisplayName: "Basic .NET 6.0",
					Description: "A simple application using .NET 6.0",
					Tags:        []string{"dotnet"},
					Icon:        "https://github.com/dotnet/brand/raw/main/logo/dotnet-logo.png",
					Type:        schema.SampleDevfileType,
					ProjectType: "dotnet",
					Language:    "dotnet",
					Provider:    "Red Hat",
					Git: &schema.Git{
						Remotes: map[string]string{
							"origin": "https://github.com/devfile-samples/devfile-sample-dotnet60-basic.git",
						},
					},
				},
			},
		},
		{
			name:           "Invalid registry",
			registryServer: "invalid-server",
			expectedError:  errors.New("registry invalid-server is invalid"),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if test.registryFolder != "" {
				registryServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					// fmt.Printf("Mock registry server handles %s\n", r.URL.Path)
					if r.URL.Path == "/index/sample" {
						samples, loadErr := ioutil.ReadFile(path.Join(test.registryFolder, "sample.json"))
						if loadErr != nil {
							t.Errorf("Could not read samples: %v", loadErr)
							w.WriteHeader(http.StatusInternalServerError)
							w.Write([]byte(fmt.Sprintf("Could not read samples\n%v", loadErr)))
							return
						}
						w.WriteHeader(http.StatusOK)
						w.Write(samples)
					} else {
						w.WriteHeader(http.StatusNotFound)
					}
				}))
				defer registryServer.Close()

				test.registryServer = registryServer.URL
				testRegistryServer = test.registryServer
			}

			bytes, actualError := GetRegistrySamples(test.registryServer)

			if test.expectedError == nil && actualError != nil {
				t.Errorf("Error does not match expectation:\n%v\nbut got\n%v", test.expectedError, actualError)
				return
			} else if test.expectedError != nil && (actualError == nil || test.expectedError.Error() != actualError.Error()) {
				t.Errorf("Error does not match expectation:\n%v\nbut got\n%v", test.expectedError, actualError)
				return
			}

			if test.expectedSamples != nil {
				var parsedRegistryIndex []schema.Schema
				parseError := json.Unmarshal(bytes, &parsedRegistryIndex)
				actualRegistryIndex, _ := json.MarshalIndent(parsedRegistryIndex, "", "  ")
				expectedRegistryIndex, _ := json.MarshalIndent(test.expectedSamples, "", "  ")
				if parseError != nil {
					t.Errorf("Got unexpected error: %s", parseError)
					return
				}
				if strings.Compare(string(expectedRegistryIndex), string(actualRegistryIndex)) != 0 {
					t.Errorf("expected %s does not match actual %s", expectedRegistryIndex, actualRegistryIndex)
				}
			}
		})
	}
}

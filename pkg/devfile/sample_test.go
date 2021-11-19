package devfile

import (
	"encoding/json"
	"reflect"
	"testing"

	"github.com/devfile/registry-support/index/generator/schema"
)

func TestGetRegistrySamples(t *testing.T) {

	nodejsBase64Image := "https://nodejs.org/static/images/logos/nodejs-new-pantone-black.svg"

	quarkusBase64Image := "https://design.jboss.org/quarkus/logo/final/SVG/quarkus_icon_rgb_default.svg"

	springBootBase64Image := "https://spring.io/images/projects/spring-edf462fec682b9d48cf628eaf9e19521.svg"

	pythonBase64Image := "https://www.python.org/static/community_logos/python-logo-generic.svg"

	tests := []struct {
		name        string
		registry    string
		wantSamples []schema.Schema
		wantErr     bool
	}{
		{
			name:     "Fetch the sample",
			registry: DEVFILE_STAGING_REGISTRY_URL,
			wantSamples: []schema.Schema{
				{
					Name:        "nodejs-basic",
					DisplayName: "Basic Node.js",
					Description: "A simple Hello World Node.js application",
					Tags:        []string{"NodeJS", "Express"},
					Icon:        nodejsBase64Image,
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
					Icon:        quarkusBase64Image,
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
					Icon:        springBootBase64Image,
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
					Icon:        pythonBase64Image,
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
			},
		},
		{
			name:     "Invalid registry",
			registry: "invalid",
			wantErr:  true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bytes, err := GetRegistrySamples(tt.registry)
			if tt.wantErr && err == nil {
				t.Errorf("Expected error from test but got nil")
			} else if !tt.wantErr && err != nil {
				t.Errorf("Got unexpected error: %s", err)
			} else if !tt.wantErr {
				var registryIndex []schema.Schema
				err = json.Unmarshal(bytes, &registryIndex)
				if err != nil {
					t.Errorf("Got unexpected error: %s", err)
					return
				}
				if !reflect.DeepEqual(registryIndex, tt.wantSamples) {
					t.Errorf("expected %+v does not match actual %+v", registryIndex, tt.wantSamples)
				}

			}
		})
	}
}

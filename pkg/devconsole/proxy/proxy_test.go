package proxy

import (
	"bytes"
	"encoding/json"
	"net/http"
	"reflect"
	"testing"

	"github.com/openshift/console/pkg/auth"
)

var user = &auth.User{
	ID:       "test-id",
	Username: "test-user",
	Token:    "test-token",
}

func TestProxyEndpoint(t *testing.T) {
	tests := []struct {
		testName         string
		request          ProxyRequest
		expectedResponse ProxyResponse
	}{
		{
			testName: "valid GET",
			request: ProxyRequest{
				Url:    "https://artifacthub.io/api/v1/packages/helm/tekton/tekton-pipeline",
				Method: http.MethodGet,
			},
			expectedResponse: ProxyResponse{
				StatusCode: http.StatusOK,
				Headers: http.Header{
					"Content-Type":   {"application/json"},
					"Content-Length": {"15"},
					"Authorization":  {user.Token},
				},
				Body: apiBody,
			},
		},
		{
			testName: "valid GET without method",
			request: ProxyRequest{
				Url: "https://artifacthub.io/api/v1/packages/helm/tekton/tekton-pipeline",
			},
			expectedResponse: ProxyResponse{
				StatusCode: http.StatusOK,
				Headers: http.Header{
					"Content-Type":   {"application/json"},
					"Content-Length": {"15"},
					"Authorization":  {user.Token},
				},
				Body: apiBody,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.testName, func(t *testing.T) {

			body, err := json.Marshal(tt.request)
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
			}

			req, err := http.NewRequest(http.MethodPost, "/proxy", bytes.NewBuffer(body))
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
			}

			actual, err := serve(req, user)
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
			actual.Headers.Del("Date")
			if !reflect.DeepEqual(tt.expectedResponse.Body, actual.Body) {
				t.Errorf("Response does not match expectation:\n%v\nbut got\n%v", tt.expectedResponse, actual)
			}
		})
	}
}

var apiBody = "{\"package_id\":\"b1a4ba18-5b16-44ce-b2ac-6192076a7338\",\"name\":\"tekton-pipeline\",\"normalized_name\":\"tekton-pipeline\",\"is_operator\":false,\"description\":\"A Helm chart for Tekton Pipelines\",\"logo_image_id\":\"daa05ffa-5ae0-4dbf-b0a6-2483fa5ad82a\",\"home_url\":\"https://github.com/cdfoundation/tekton-helm-chart\",\"readme\":\"# tekton helm chart\\n\\n## Setup\\nFirst add the Jenkins X chart repository\\n\\n```sh\\nhelm repo add cdf https://cdfoundation.github.io/tekton-helm-chart/\\n```\\nIf it already exists be sure to update the local cache\\n```\\nhelm repo update\\n```\\n\\n## Basic install\\n```\\nhelm upgrade --install tekton cdf/tekton-pipeline\\n```\\n\\n## Authenticated Git requests\\nIf you are working with private git repositories or require secrets to tag or perform remote git actions then you can provide basic authentication which will be automatically mounted into Tekton Pipline pods.  We recommend using a bot user and a personal access token.\\n\\nGitHub Example:\\n\\n```sh\\nhelm upgrade --install --set auth.git.username=bot-user --set auth.git.password=123456abcdef --set auth.git.url=https://github.com tekton jenkins-x/tekton \\n```\\n## Authenticated Docker registries\\nIf you are pushing images to authenticated docker registries you can provide basic authentication which will be automatically mounted into Knative Tekton Pipline pods.\\n\\nDockerHub Example:\\n\\n```sh\\nhelm upgrade --install --set auth.docker.username=fred --set auth.docker.password=flintstone --set auth.docker.url=https://index.docker.io/v1/  tekton jenkins-x/tekton \\n```\\n## Configuration options\\n\\n|       Parameter                 |           Description                             |                         Default                                                 |\\n|----------------------------------------|---------------------------------------------------|--------------------------------------------------------------------------|\\n| `auth.git.username`             | Optional basic auth username for git provider     | ``                                                                              |\\n| `auth.git.password`             | Optional basic auth password for git provider     | ``                                                                              |\\n| `auth.git.url`                  | Optional basic auth server for git provider       | `https://github.com`                                                            |\\n| `auth.docker.username`          | Optional basic auth username for docker registry  | ``                                                                              |\\n| `auth.docker.password`          | Optional basic auth password for docker registry  | ``                                                                              |\\n| `auth.docker.url`               | Optional basic auth server for docker registry    | `https://index.docker.io/v1/`                                                   |\\n| `image.tag`                     | Docker image tag                                  | `see latest values.yaml`                                                        |\\n| `image.kubeconfigwriter`        | Docker image                                      | `gcr.io/knative-nightly/github.com/knative/build-pipeline/cmd/kubeconfigwriter` |\\n| `image.credsinit`               | Docker image                                      | `gcr.io/knative-nightly/github.com/knative/build-pipeline/cmd/creds-init`       |\\n| `image.gitinit`                 | Docker image                                      | `gcr.io/knative-nightly/github.com/knative/build-pipeline/cmd/git-init`         |\\n| `image.nop`                     | Docker image                                      | `gcr.io/knative-nightly/github.com/knative/build-pipeline/cmd/nop`              |\\n| `image.bash`                    | Docker image                                      | `gcr.io/knative-nightly/github.com/knative/build-pipeline/cmd/bash`             |\\n| `image.gsutil`                  | Docker image                                      | `gcr.io/knative-nightly/github.com/knative/build-pipeline/cmd/gsutil`           |\\n| `image.controller`              | Docker image                                      | `gcr.io/knative-nightly/github.com/knative/build-pipeline/cmd/controller`       |\\n| `image.webhook`                 | Docker image                                      | `gcr.io/knative-nightly/github.com/knative/build-pipeline/cmd/webhook`          |\\n\",\"data\":{\"type\":\"\",\"apiVersion\":\"v1\",\"kubeVersion\":\"\"},\"version\":\"1.0.2\",\"available_versions\":[{\"version\":\"1.0.2\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1690543907},{\"version\":\"1.0.1\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1689932789},{\"version\":\"1.0.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1689768818},{\"version\":\"0.6.4\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1688562843},{\"version\":\"0.6.2\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1687856517},{\"version\":\"0.6.1\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1687854769},{\"version\":\"0.6.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1687448652},{\"version\":\"0.5.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1669397545},{\"version\":\"0.4.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1669334808},{\"version\":\"0.3.1\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1667528976},{\"version\":\"0.3.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1667227422},{\"version\":\"0.2.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1658261328},{\"version\":\"0.1.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1657934348},{\"version\":\"0.29.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647473788},{\"version\":\"0.27.2\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647473341},{\"version\":\"0.23.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.24.1\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.24.2\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.0.1\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.24.4\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.25.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.26.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.26.1\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.27.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.27.1\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.24.3\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.0.2\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.0.3\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.0.4\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.0.5\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.17.1\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.17.3\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.18.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.18.0-1\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.19.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.19.1\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.20.1\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.21.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.21.1\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677},{\"version\":\"0.22.0\",\"contains_security_updates\":false,\"prerelease\":false,\"ts\":1647354677}],\"app_version\":\"0.42.0\",\"digest\":\"d29112db2db28b756d39a35941f3039df6848a700ccc25cd8d99d3bf7e5717cd\",\"deprecated\":false,\"contains_security_updates\":false,\"prerelease\":false,\"signed\":false,\"content_url\":\"https://cdfoundation.github.io/tekton-helm-chart/tekton-pipeline-1.0.2.tgz\",\"containers_images\":[{\"name\":\"\",\"image\":\"gcr.io/tekton-releases/github.com/tektoncd/pipeline/cmd/controller:v0.42.0@sha256:1fa50403c071b768984e23e26d0e68d2f7e470284ef2eb73581ec556bacdad95\",\"whitelisted\":false},{\"name\":\"\",\"image\":\"gcr.io/tekton-releases/github.com/tektoncd/pipeline/cmd/resolvers:v0.42.0@sha256:eaa7d21d45f0bc1c411823d6a943e668c820f9cf52f1549d188edb89e992f6e0\",\"whitelisted\":false},{\"name\":\"\",\"image\":\"gcr.io/tekton-releases/github.com/tektoncd/pipeline/cmd/webhook:v0.42.0@sha256:90989eeb6e0ba9c481b1faba3b01bcc70725baa58484c8f6ce9d22cc601e63dc\",\"whitelisted\":false}],\"all_containers_images_whitelisted\":false,\"has_values_schema\":false,\"has_changelog\":false,\"ts\":1690543907,\"repository\":{\"repository_id\":\"0648b8bf-a545-45d7-ada4-2f846b1968f7\",\"name\":\"tekton\",\"display_name\":\"tekton\",\"url\":\"https://cdfoundation.github.io/tekton-helm-chart/\",\"private\":false,\"kind\":0,\"verified_publisher\":false,\"official\":false,\"scanner_disabled\":true,\"organization_name\":\"webofmars\",\"organization_display_name\":\"webofmars\"},\"stats\":{\"subscriptions\":0,\"webhooks\":0},\"production_organizations_count\":0}"

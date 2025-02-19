package artifacthub

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/devconsole/common"
)

const (
	ARTIFACTHUB_API_BASE_URL string = "https://artifacthub.io/api/v1"
	GITHUB_BASE_URL          string = "https://github.com"
)

func GetTaskYAMLFromGithub(r *http.Request, user *auth.User) (common.DevConsoleCommonResponse, error) {
	var request TaskYAMLRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}

	GITHUB_TASK_YAML_URL := fmt.Sprintf("%s/%s", GITHUB_BASE_URL, request.YamlPath)

	var serviceRequest *http.Request
	serviceRequest, err = http.NewRequest(http.MethodGet, GITHUB_TASK_YAML_URL, nil)

	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to create request: %v", err)
	}

	serviceTransport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
	}

	serviceClient := &http.Client{
		Transport: serviceTransport,
	}

	serviceResponse, err := serviceClient.Do(serviceRequest)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to send request: %v", err)
	}
	defer serviceResponse.Body.Close()
	serviceResponseBody, err := io.ReadAll(serviceResponse.Body)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to read response body: %v", err)
	}

	return common.DevConsoleCommonResponse{
		StatusCode: serviceResponse.StatusCode,
		Headers:    serviceResponse.Header,
		Body:       string(serviceResponseBody),
	}, nil

}

func GetTaskDetails(r *http.Request, user *auth.User) (common.DevConsoleCommonResponse, error) {
	var request TaskDetailsRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}

	ARTIFACTHUB_TASKS_DETAILS_URL := fmt.Sprintf("%s/packages/tekton-task/%s/%s/%s", ARTIFACTHUB_API_BASE_URL, request.RepoName, request.Name, request.Version)

	var serviceRequest *http.Request
	serviceRequest, err = http.NewRequest(http.MethodGet, ARTIFACTHUB_TASKS_DETAILS_URL, nil)

	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to create request: %v", err)
	}

	serviceTransport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
	}

	serviceClient := &http.Client{
		Transport: serviceTransport,
	}

	serviceResponse, err := serviceClient.Do(serviceRequest)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to send request: %v", err)
	}
	defer serviceResponse.Body.Close()
	serviceResponseBody, err := io.ReadAll(serviceResponse.Body)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to read response body: %v", err)
	}

	return common.DevConsoleCommonResponse{
		StatusCode: serviceResponse.StatusCode,
		Headers:    serviceResponse.Header,
		Body:       string(serviceResponseBody),
	}, nil
}

func SearchTasks(r *http.Request, user *auth.User) (common.DevConsoleCommonResponse, error) {
	var request SearchRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}

	ARTIFACTHUB_TASKS_SEARCH_URL := ARTIFACTHUB_API_BASE_URL + "/packages/search?offset=0&limit=60&facets=false&kind=7&deprecated=false&sort=relevance"

	if request.SearchQuery != "" {
		ARTIFACTHUB_TASKS_SEARCH_URL = fmt.Sprintf("%s&ts_query_web=%s", ARTIFACTHUB_TASKS_SEARCH_URL, request.SearchQuery)
	}

	var serviceRequest *http.Request

	serviceRequest, err = http.NewRequest(http.MethodGet, ARTIFACTHUB_TASKS_SEARCH_URL, nil)

	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to create request: %v", err)
	}

	serviceTransport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
	}

	serviceClient := &http.Client{
		Transport: serviceTransport,
	}

	serviceResponse, err := serviceClient.Do(serviceRequest)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to send request: %v", err)
	}
	defer serviceResponse.Body.Close()
	serviceResponseBody, err := io.ReadAll(serviceResponse.Body)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to read response body: %v", err)
	}

	return common.DevConsoleCommonResponse{
		StatusCode: serviceResponse.StatusCode,
		Headers:    serviceResponse.Header,
		Body:       string(serviceResponseBody),
	}, nil
}

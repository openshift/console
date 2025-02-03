package webhooks

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/devconsole/common"
)

func CreateGithubWebhook(r *http.Request, user *auth.User) (common.DevConsoleCommonResponse, error) {
	// POST /api/dev-console/webhooks/github
	var request GithubWebhookRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}

	bodyBytes, err := json.Marshal(request.Body)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to marshal request body: %v", err)
	}

	GH_WEBHOOK_URL := fmt.Sprintf("%s/repos/%s/%s/hooks", request.HostName, request.Owner, request.RepoName)

	var serviceRequest *http.Request
	serviceRequest, err = http.NewRequest(http.MethodPost, GH_WEBHOOK_URL, bytes.NewReader(bodyBytes))
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to create request: %v", err)
	}

	for key, values := range request.Headers {
		for _, value := range values {
			serviceRequest.Header.Add(key, value)
		}
	}

	if request.AllowAuthHeader {
		serviceRequest.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
	}

	var serviceTransport *http.Transport
	if request.AllowInsecure {
		serviceTransport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}
	} else {
		serviceTransport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
		}
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

func CreateGitlabWebhook(r *http.Request, user *auth.User) (common.DevConsoleCommonResponse, error) {
	// POST /api/dev-console/webhooks/gitlab

	var request GitlabWebhookRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}

	bodyBytes, err := json.Marshal(request.Body)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to marshal request body: %v", err)
	}

	GL_WEBHOOK_URL := fmt.Sprintf("%s/api/v4/projects/%s/hooks", request.HostName, request.ProjectID)

	var serviceRequest *http.Request
	serviceRequest, err = http.NewRequest(http.MethodPost, GL_WEBHOOK_URL, bytes.NewReader(bodyBytes))
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to create request: %v", err)
	}

	for key, values := range request.Headers {
		for _, value := range values {
			serviceRequest.Header.Add(key, value)
		}
	}

	if request.AllowAuthHeader {
		serviceRequest.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
	}

	var serviceTransport *http.Transport
	if request.AllowInsecure {
		serviceTransport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}
	} else {
		serviceTransport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
		}
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

func CreateBitbucketWebhook(r *http.Request, user *auth.User) (common.DevConsoleCommonResponse, error) {
	// POST /api/dev-console/webhooks/bitbucket

	var request BitbucketWebhookRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}

	bodyBytes, err := json.Marshal(request.Body)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to marshal request body: %v", err)
	}

	var BB_WEBHOOK_URL string
	if request.IsServer {
		BB_WEBHOOK_URL = fmt.Sprintf("%s/projects/%s/repos/%s/hooks", request.BaseURL, request.Owner, request.RepoName)
	} else {
		BB_WEBHOOK_URL = fmt.Sprintf("%s/repositories/%s/%s/hooks", request.BaseURL, request.Owner, request.RepoName)
	}

	var serviceRequest *http.Request
	serviceRequest, err = http.NewRequest(http.MethodPost, BB_WEBHOOK_URL, bytes.NewReader(bodyBytes))
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to create request: %v", err)
	}

	for key, values := range request.Headers {
		for _, value := range values {
			serviceRequest.Header.Add(key, value)
		}
	}

	if request.AllowAuthHeader {
		serviceRequest.Header.Set("Authorization", fmt.Sprintf("Bearer %s", user.Token))
	}

	var serviceTransport *http.Transport
	if request.AllowInsecure {
		serviceTransport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}
	} else {
		serviceTransport = &http.Transport{
			Proxy: http.ProxyFromEnvironment,
		}
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

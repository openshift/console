package webhooks

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"slices"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/devconsole/common"
)

var client *http.Client = &http.Client{
	Transport: &http.Transport{
		Proxy: http.ProxyFromEnvironment,
	},
}

func makeHTTPRequest(ctx context.Context, url string, headers http.Header, body []byte, proxyHeaderDenyList []string) (common.DevConsoleCommonResponse, error) {
	serviceRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to create request: %v", err)
	}

	for key, values := range headers {
		if slices.Contains(proxyHeaderDenyList, key) {
			continue
		}
		for _, value := range values {
			serviceRequest.Header.Add(key, value)
		}
	}

	serviceResponse, err := client.Do(serviceRequest)
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

func CreateGithubWebhook(r *http.Request, user *auth.User, proxyHeaderDenyList []string) (common.DevConsoleCommonResponse, error) {
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

	GH_WEBHOOK_URL := fmt.Sprintf("%s/repos/%s/%s/hooks",
		request.HostName,
		url.PathEscape(request.Owner),
		url.PathEscape(request.RepoName),
	)

	return makeHTTPRequest(r.Context(), GH_WEBHOOK_URL, request.Headers, bodyBytes, proxyHeaderDenyList)

}

func CreateGitlabWebhook(r *http.Request, user *auth.User, proxyHeaderDenyList []string) (common.DevConsoleCommonResponse, error) {
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

	GL_WEBHOOK_URL := fmt.Sprintf("%s/api/v4/projects/%s/hooks",
		request.HostName,
		url.PathEscape(request.ProjectID),
	)

	return makeHTTPRequest(r.Context(), GL_WEBHOOK_URL, request.Headers, bodyBytes, proxyHeaderDenyList)
}

func CreateBitbucketWebhook(r *http.Request, user *auth.User, proxyHeaderDenyList []string) (common.DevConsoleCommonResponse, error) {
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
		BB_WEBHOOK_URL = fmt.Sprintf("%s/projects/%s/repos/%s/hooks",
			request.BaseURL,
			url.PathEscape(request.Owner),
			url.PathEscape(request.RepoName),
		)
	} else {
		BB_WEBHOOK_URL = fmt.Sprintf("%s/repositories/%s/%s/hooks",
			request.BaseURL,
			url.PathEscape(request.Owner),
			url.PathEscape(request.RepoName),
		)
	}

	return makeHTTPRequest(r.Context(), BB_WEBHOOK_URL, request.Headers, bodyBytes, proxyHeaderDenyList)
}

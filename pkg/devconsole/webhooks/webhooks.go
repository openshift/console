package webhooks

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"slices"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/devconsole/common"
)

const maxResponseBodySize = 10 * 1024 * 1024 // 10 MB

var webhookHeaderDenyList = []string{"Host", "Authorization"}

var client = newSafeHTTPClient()

func makeHTTPRequest(ctx context.Context, url string, headers http.Header, body []byte, proxyHeaderDenyList []string) (common.DevConsoleCommonResponse, error) {
	serviceRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to create request: %v", err)
	}

	for key, values := range headers {
		canonicalKey := http.CanonicalHeaderKey(key)
		if slices.ContainsFunc(proxyHeaderDenyList, func(deny string) bool {
			return http.CanonicalHeaderKey(deny) == canonicalKey
		}) {
			continue
		}
		if slices.ContainsFunc(webhookHeaderDenyList, func(deny string) bool {
			return http.CanonicalHeaderKey(deny) == canonicalKey
		}) {
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

	limitedReader := io.LimitReader(serviceResponse.Body, maxResponseBodySize+1)
	serviceResponseBody, err := io.ReadAll(limitedReader)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to read response body: %v", err)
	}
	if len(serviceResponseBody) > maxResponseBodySize {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("response body exceeds maximum allowed size of %d bytes", maxResponseBodySize)
	}

	return common.DevConsoleCommonResponse{
		StatusCode: serviceResponse.StatusCode,
		Headers:    serviceResponse.Header,
		Body:       string(serviceResponseBody),
	}, nil
}

func CreateGithubWebhook(r *http.Request, user *auth.User, proxyHeaderDenyList []string) (common.DevConsoleCommonResponse, error) {
	var request GithubWebhookRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}

	bodyBytes, err := json.Marshal(request.Body)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to marshal request body: %v", err)
	}

	baseURL, err := validateHostURL(request.HostName)
	if err != nil {
		return common.DevConsoleCommonResponse{}, &common.ValidationError{Err: fmt.Errorf("invalid hostName: %v", err)}
	}
	webhookURL := baseURL.JoinPath("repos", request.Owner, request.RepoName, "hooks")

	return makeHTTPRequest(r.Context(), webhookURL.String(), request.Headers, bodyBytes, proxyHeaderDenyList)
}

func CreateGitlabWebhook(r *http.Request, user *auth.User, proxyHeaderDenyList []string) (common.DevConsoleCommonResponse, error) {
	var request GitlabWebhookRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}

	bodyBytes, err := json.Marshal(request.Body)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to marshal request body: %v", err)
	}

	baseURL, err := validateHostURL(request.HostName)
	if err != nil {
		return common.DevConsoleCommonResponse{}, &common.ValidationError{Err: fmt.Errorf("invalid hostName: %v", err)}
	}
	webhookURL := baseURL.JoinPath("api", "v4", "projects", request.ProjectID, "hooks")

	return makeHTTPRequest(r.Context(), webhookURL.String(), request.Headers, bodyBytes, proxyHeaderDenyList)
}

func CreateBitbucketWebhook(r *http.Request, user *auth.User, proxyHeaderDenyList []string) (common.DevConsoleCommonResponse, error) {
	var request BitbucketWebhookRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to parse request: %v", err)
	}

	bodyBytes, err := json.Marshal(request.Body)
	if err != nil {
		return common.DevConsoleCommonResponse{}, fmt.Errorf("failed to marshal request body: %v", err)
	}

	baseURL, err := validateHostURL(request.BaseURL)
	if err != nil {
		return common.DevConsoleCommonResponse{}, &common.ValidationError{Err: fmt.Errorf("invalid baseURL: %v", err)}
	}

	var webhookURL string
	if request.IsServer {
		webhookURL = baseURL.JoinPath("projects", request.Owner, "repos", request.RepoName, "hooks").String()
	} else {
		webhookURL = baseURL.JoinPath("repositories", request.Owner, request.RepoName, "hooks").String()
	}

	return makeHTTPRequest(r.Context(), webhookURL, request.Headers, bodyBytes, proxyHeaderDenyList)
}

package webhooks

import (
	"net/http"
)

type GHWebhookBody struct {
	Name   string `json:"name"`
	Active bool   `json:"active"`
	Config struct {
		URL         string `json:"url"`
		ContentType string `json:"content_type"`
		InsecureSSL string `json:"insecure_ssl"`
		Secret      string `json:"secret"`
	} `json:"config"`
	Events []string `json:"events"`
}

type GithubWebhookRequest struct {
	Headers  http.Header   `json:"headers"`
	HostName string        `json:"hostName"`
	Owner    string        `json:"owner"`
	RepoName string        `json:"repoName"`
	Body     GHWebhookBody `json:"body"`
}

type GLWebhookBody struct {
	URL                   string `json:"url"`
	PushEvents            bool   `json:"push_events"`
	MergeRequestsEvents   bool   `json:"merge_requests_events"`
	EnableSSLVerification bool   `json:"enable_ssl_verification"`
	Token                 string `json:"token"`
}

type GitlabWebhookRequest struct {
	Headers   http.Header   `json:"headers"`
	HostName  string        `json:"hostName"`
	ProjectID string        `json:"projectID"`
	Body      GLWebhookBody `json:"body"`
}

type BBWebhookBody struct {
	URL                  string   `json:"url"`
	Events               []string `json:"events"`
	SkipCertVerification bool     `json:"skip_cert_verification"`
	Active               bool     `json:"active"`
}

type BitbucketWebhookRequest struct {
	Headers  http.Header   `json:"headers"`
	IsServer bool          `json:"isServer"`
	BaseURL  string        `json:"baseURL"`
	Owner    string        `json:"owner"`
	RepoName string        `json:"repoName"`
	Body     BBWebhookBody `json:"body"`
}

package devconsole

import (
	"net/http"
	"strings"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/devconsole/artifacthub"
	"github.com/openshift/console/pkg/devconsole/webhooks"
	"github.com/openshift/console/pkg/serverutils"
	"k8s.io/client-go/dynamic"
)

type handlerFunc func(r *http.Request, user *auth.User, dynamicClient *dynamic.DynamicClient, k8sMode string, proxyHeaderDenyList []string) (interface{}, error)

func handleRequest(w http.ResponseWriter, r *http.Request, user *auth.User, dynamicClient *dynamic.DynamicClient, k8sMode string, proxyHeaderDenyList []string, handler handlerFunc) {
	response, err := handler(r, user, dynamicClient, k8sMode, proxyHeaderDenyList)
	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: err.Error()})
		return
	}
	serverutils.SendResponse(w, http.StatusOK, response)
}

func Handler(user *auth.User, w http.ResponseWriter, r *http.Request, dynamicClient *dynamic.DynamicClient, k8sMode string, proxyHeaderDenyList []string) {
	path := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(path) != 2 {
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: "Invalid URL"})
		return
	}

	// Define routes
	routes := map[string]map[string]handlerFunc{
		"artifacthub": {
			// POST /api/dev-console/artifacthub/search
			"search": func(r *http.Request, user *auth.User, _ *dynamic.DynamicClient, _ string, _ []string) (interface{}, error) {
				return artifacthub.SearchTasks(r, user)
			},
			// POST /api/dev-console/artifacthub/get
			"get": func(r *http.Request, user *auth.User, _ *dynamic.DynamicClient, _ string, _ []string) (interface{}, error) {
				return artifacthub.GetTaskDetails(r, user)
			},
			// POST /api/dev-console/artifacthub/yaml
			"yaml": func(r *http.Request, user *auth.User, _ *dynamic.DynamicClient, _ string, _ []string) (interface{}, error) {
				return artifacthub.GetTaskYAMLFromGithub(r, user)
			},
		},
		"webhooks": {
			// POST /api/dev-console/webhooks/github
			"github": func(r *http.Request, user *auth.User, _ *dynamic.DynamicClient, _ string,
				proxyHeaderDenyList []string) (interface{}, error) {

				return webhooks.CreateGithubWebhook(r, user, proxyHeaderDenyList)
			},
			// POST /api/dev-console/webhooks/gitlab
			"gitlab": func(r *http.Request, user *auth.User, _ *dynamic.DynamicClient, _ string, proxyHeaderDenyList []string) (interface{}, error) {
				return webhooks.CreateGitlabWebhook(r, user, proxyHeaderDenyList)
			},
			// POST /api/dev-console/webhooks/bitbucket
			"bitbucket": func(r *http.Request, user *auth.User, _ *dynamic.DynamicClient, _ string, proxyHeaderDenyList []string) (interface{}, error) {
				return webhooks.CreateBitbucketWebhook(r, user, proxyHeaderDenyList)
			},
		},
	}

	// Check for valid route and method
	if methodHandlers, ok := routes[path[0]]; ok {
		if handler, ok := methodHandlers[path[1]]; ok {
			if r.Method != http.MethodPost {
				serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Invalid method: only POST is allowed"})
				return
			}
			handleRequest(w, r, user, dynamicClient, k8sMode, proxyHeaderDenyList, handler)
			return
		}
	}

	serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{Err: "Invalid URL"})
}

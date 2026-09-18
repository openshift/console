package devfile

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path"
	"strings"

	"github.com/openshift/console/pkg/serverutils"
	"k8s.io/klog"

	devfile "github.com/devfile/library/v2/pkg/devfile"
	"github.com/devfile/library/v2/pkg/devfile/parser"
)

// maxDevfileRequestBodySize caps the size of a devfile request body the console
// backend will read. Devfiles are small YAML documents, so 1 MiB is generous
// while preventing unbounded memory growth from malicious large POSTs.
const maxDevfileRequestBodySize = 1 << 20 // 1 MiB

func DevfileSamplesHandler(w http.ResponseWriter, r *http.Request) {
	registry := r.URL.Query().Get("registry")
	if registry == "" {
		errMsg := "The registry parameter is missing"
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	sampleIndex, err := GetRegistrySamples(registry)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to read from registry %s: %v", registry, err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(sampleIndex)
}

func DevfileHandler(w http.ResponseWriter, r *http.Request) {
	var (
		data       DevfileForm
		devfileObj parser.DevfileObj
	)

	r.Body = http.MaxBytesReader(w, r.Body, maxDevfileRequestBodySize)

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&data)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to decode response: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	// Decode reads only the first JSON value and stops, so it would silently accept
	// (and never fully read under MaxBytesReader) a small valid object followed by
	// arbitrary trailing data. Require the body to contain exactly one JSON value by
	// confirming the stream is at EOF.
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		errMsg := "Request body must contain a single JSON object"
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	// Get devfile content and parse it using a library call in the future
	devfileContentBytes := []byte(data.Devfile.DevfileContent)
	//reduce the http request and response timeouts on the devfile library parser to 10s
	httpTimeout := 10
	devfileObj, _, err = devfile.ParseDevfileAndValidate(parser.ParserArgs{Data: devfileContentBytes, HTTPTimeout: &httpTimeout})
	if err != nil {
		// The parser resolves parent.uri, kubernetes.uri, and plugin references
		// over HTTP and can embed the resolved response body in its error. Never
		// reflect the raw error to the client, as that would turn a parse failure
		// into a partial-read SSRF oracle. Log the full error server-side and
		// return a generic message instead.
		klog.Errorf("Failed to parse devfile: %v", err)

		clientErrMsg := "Failed to parse devfile."
		if strings.Contains(err.Error(), "schemaVersion not present in devfile") {
			clientErrMsg = "Failed to parse devfile: schemaVersion not present in devfile. Only devfile 2.2.0 or above is supported. The devfile needs to have the schemaVersion set in the metadata section with a value of 2.2.0 or above."
		}

		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: clientErrMsg})
		return
	}

	deployAssociatedComponents, err := GetDeployComponents(devfileObj)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get the deploy command associated components from devfile: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	imageBuildComponent, err := GetImageBuildComponent(devfileObj, deployAssociatedComponents)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get an image component from the devfile: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}

	dockerfileRelativePath := imageBuildComponent.Image.Dockerfile.Uri
	if dockerfileRelativePath == "" {
		errMsg := fmt.Sprintf("Failed to get the Dockerfile location, dockerfile uri is not defined by image component %v", imageBuildComponent.Name)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	dockerRelativeSrcContext := imageBuildComponent.Image.Dockerfile.BuildContext
	if dockerRelativeSrcContext == "" {
		errMsg := fmt.Sprintf("Failed to get the dockefile context location, dockerfile buildcontext is not defined by image component %v", imageBuildComponent.Name)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	deploymentResource, serviceResource, routeResource, err := GetResourceFromDevfile(devfileObj, deployAssociatedComponents, data.Name)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get Kubernetes resource for the devfile: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}

	dockerContextDir := path.Join(data.Git.Dir, dockerRelativeSrcContext)

	devfileResources := DevfileResources{
		ImageStream:    GetImageStream(),
		BuildResource:  GetBuildResource(data, dockerfileRelativePath, dockerContextDir),
		DeployResource: *deploymentResource,
		Service:        serviceResource,
		Route:          routeResource,
	}

	w.Header().Set("Content-Type", "application/json")
	resp, err := json.Marshal(devfileResources)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to marshal the response: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
	}
	w.Write(resp)
}

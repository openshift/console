package devfile

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path"
	"strings"

	"github.com/openshift/console/pkg/serverutils"
	"k8s.io/klog"

	devfile "github.com/devfile/library/pkg/devfile"
	"github.com/devfile/library/pkg/devfile/parser"
)

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

	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to decode response: %v", err)
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
		errMsg := "Failed to parse devfile:"
		if strings.Contains(err.Error(), "schemaVersion not present in devfile") {
			errMsg = fmt.Sprintf("%s schemaVersion not present in devfile. Only devfile 2.2.0 or above is supported. The devfile needs to have the schemaVersion set in the metadata section with a value of 2.2.0 or above.", errMsg)
		} else {
			errMsg = fmt.Sprintf("%s %s", errMsg, err)
		}

		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
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

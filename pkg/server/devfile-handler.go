package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path"

	buildv1 "github.com/openshift/api/build/v1"
	imagev1 "github.com/openshift/api/image/v1"
	routev1 "github.com/openshift/api/route/v1"
	devfilePkg "github.com/openshift/console/pkg/devfile"
	"github.com/openshift/console/pkg/serverutils"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/klog"

	devfilev1 "github.com/devfile/api/v2/pkg/apis/workspaces/v1alpha2"
	devfile "github.com/devfile/library/pkg/devfile"
	"github.com/devfile/library/pkg/devfile/generator"
	"github.com/devfile/library/pkg/devfile/parser"
	"github.com/devfile/library/pkg/devfile/parser/data/v2/common"
)

func (s *Server) devfileSamplesHandler(w http.ResponseWriter, r *http.Request) {

	var data devfileSamplesForm
	registry := devfilePkg.DEVFILE_REGISTRY_PLACEHOLDER_URL

	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to decode response: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	if data.Registry != "" {
		registry = data.Registry
	}

	sampleIndex, err := devfilePkg.GetRegistrySamples(registry)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to read from registry %s: %v", registry, err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(sampleIndex)
}

func (s *Server) devfileHandler(w http.ResponseWriter, r *http.Request) {
	var (
		data       devfileForm
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
	devfileObj, err = devfile.ParseFromDataAndValidate(devfileContentBytes)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to parse devfile: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	filterOptions := common.DevfileOptions{
		Filter: map[string]interface{}{
			"tool": "console-import",
		},
	}

	containerComponents, err := devfileObj.Data.GetDevfileContainerComponents(filterOptions) //For Dev Preview, if there is more than one component container err out
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get the container component from devfile with attribute 'tool: console-import': %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}
	if len(containerComponents) != 1 {
		errMsg := "Console Devfile Import Dev Preview, supports only one component container with attribute 'tool: console-import'"
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	deploymentResource, err := getDeployResource(data, devfileObj, filterOptions)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get deployment resource for the devfile: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}

	service, err := getService(devfileObj, filterOptions)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get service for the devfile: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}

	dockerfileRelativePath := devfileObj.Data.GetMetadata().Attributes.GetString("alpha.build-dockerfile", &err)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get the Dockerfile location from devfile metadata attribute 'alpha.build-dockerfile': %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	dockerRelativeSrcContext := devfileObj.Data.GetMetadata().Attributes.GetString("alpha.build-context", &err)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get the Dockerfile location from devfile metadata attribute 'alpha.build-context': %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	dockerContextDir := path.Join(data.Git.Dir, dockerRelativeSrcContext)

	devfileResources := devfileResources{
		ImageStream:    getImageStream(),
		BuildResource:  getBuildResource(data, dockerfileRelativePath, dockerContextDir),
		DeployResource: deploymentResource,
		Service:        service,
		Route:          getRoutes(data, containerComponents),
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

func getImageStream() imagev1.ImageStream {

	imageStreamParams := generator.ImageStreamParams{
		TypeMeta: generator.GetTypeMeta("ImageStream", "image.openshift.io/v1"),
	}
	imageStream := generator.GetImageStream(imageStreamParams)
	return imageStream
}

func getBuildResource(data devfileForm, dockerfilePath, contextDir string) buildv1.BuildConfig {

	buildConfigParams := generator.BuildConfigParams{
		TypeMeta: generator.GetTypeMeta("BuildConfig", "build.openshift.io/v1"),
		BuildConfigSpecParams: generator.BuildConfigSpecParams{
			ImageStreamTagName: data.Name + ":latest", // TODO Post Dev Preview. Update as per proposal i.e.; use the image mentioned in the devfile and push build to it.
			GitRef:             data.Git.Ref,
			GitURL:             data.Git.URL,
			ContextDir:         contextDir,
			BuildStrategy:      generator.GetDockerBuildStrategy(dockerfilePath, nil), // TODO use the Dockerfile path from the devfile instead of assuming
		},
	}

	buildConfig := generator.GetBuildConfig(buildConfigParams)

	return *buildConfig
}

func getDeployResource(data devfileForm, devfileObj parser.DevfileObj, filterOptions common.DevfileOptions) (appsv1.Deployment, error) {

	containers, err := generator.GetContainers(devfileObj, filterOptions)
	if err != nil {
		return appsv1.Deployment{}, err
	}

	deployParams := generator.DeploymentParams{
		TypeMeta:          generator.GetTypeMeta("Deployment", "apps/v1"),
		Containers:        containers,
		PodSelectorLabels: map[string]string{"app": data.Name},
	}

	deployment := generator.GetDeployment(deployParams)

	return *deployment, nil
}

func getService(devfileObj parser.DevfileObj, filterOptions common.DevfileOptions) (corev1.Service, error) {

	serviceParams := generator.ServiceParams{
		TypeMeta: generator.GetTypeMeta("Service", "v1"),
	}

	service, err := generator.GetService(devfileObj, serviceParams, filterOptions)
	if err != nil {
		return corev1.Service{}, err
	}

	return *service, nil
}

func getRoutes(data devfileForm, containerComponents []devfilev1.Component) routev1.Route {

	var routes []routev1.Route

	for _, comp := range containerComponents {
		for _, endpoint := range comp.Container.Endpoints {
			if endpoint.Exposure == devfilev1.NoneEndpointExposure || endpoint.Exposure == devfilev1.InternalEndpointExposure {
				continue
			}
			secure := false
			if endpoint.Secure || endpoint.Protocol == "https" || endpoint.Protocol == "wss" {
				secure = true
			}
			path := "/"
			if endpoint.Path != "" {
				path = endpoint.Path
			}

			routeParams := generator.RouteParams{
				TypeMeta: generator.GetTypeMeta("Route", "route.openshift.io/v1"),
				RouteSpecParams: generator.RouteSpecParams{
					ServiceName: data.Name,
					PortNumber:  intstr.FromInt(endpoint.TargetPort),
					Path:        path,
					Secure:      secure,
				},
			}

			route := generator.GetRoute(routeParams)
			routes = append(routes, *route)
		}
	}

	return routes[0]
}

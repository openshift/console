package server

import (
	"encoding/json"
	"fmt"
	"net/http"

	buildv1 "github.com/openshift/api/build/v1"
	imagev1 "github.com/openshift/api/image/v1"
	routev1 "github.com/openshift/api/route/v1"
	"github.com/openshift/console/pkg/serverutils"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/klog"

	devfilev1 "github.com/devfile/api/pkg/apis/workspaces/v1alpha2"
	devfile "github.com/devfile/library/pkg/devfile"
	"github.com/devfile/library/pkg/devfile/generator"
	"github.com/devfile/library/pkg/devfile/parser"
)

const (
	// TODO: Support from the UI a custom path
	// dockerfilePath is the path to the Dockerfile (including the file name; ie "./my-path/Dockerfile")
	dockerfilePath = "Dockerfile"
)

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

	containerComponents := devfileObj.Data.GetDevfileContainerComponents() //TODO: filter thru Console attribute, right now if there is more than one component container err out
	if len(containerComponents) != 1 {
		errMsg := "Console Devfile Import Dev Preview, supports only one component container"
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	deploymentResource, err := getDeployResource(data, devfileObj)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get deployment resource for the devfile: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}

	service, err := getService(devfileObj)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get service for the devfile: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}

	devfileResources := devfileResources{
		ImageStream:    getImageStream(),
		BuildResource:  getBuildResource(data),
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

func getBuildResource(data devfileForm) buildv1.BuildConfig {

	buildConfigParams := generator.BuildConfigParams{
		TypeMeta: generator.GetTypeMeta("BuildConfig", "build.openshift.io/v1"),
		BuildConfigSpecParams: generator.BuildConfigSpecParams{
			ImageStreamTagName: data.Name + ":latest", // TODO Post Dev Preview. Update as per proposal i.e.; use the image mentioned in the devfile and push build to it.
			GitRef:             data.Git.Ref,
			GitURL:             data.Git.URL,
			BuildStrategy:      generator.GetDockerBuildStrategy(dockerfilePath, nil), // TODO use the Dockerfile path from the devfile instead of assuming
		},
	}

	buildConfig := generator.GetBuildConfig(buildConfigParams)
	buildConfig.Spec.CommonSpec.Source.ContextDir = data.Git.Dir

	return *buildConfig
}

func getDeployResource(data devfileForm, devfileObj parser.DevfileObj) (appsv1.Deployment, error) {

	containers, err := generator.GetContainers(devfileObj)
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

func getService(devfileObj parser.DevfileObj) (corev1.Service, error) {

	serviceParams := generator.ServiceParams{
		TypeMeta: generator.GetTypeMeta("Service", "v1"),
	}

	service, err := generator.GetService(devfileObj, serviceParams)
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

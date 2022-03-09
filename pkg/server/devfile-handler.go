package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path"
	"strconv"
	"strings"

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

	registry := r.URL.Query().Get("registry")
	if registry == "" {
		errMsg := "The registry parameter is missing"
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
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
	devfileObj, _, err = devfile.ParseDevfileAndValidate(parser.ParserArgs{Data: devfileContentBytes})
	if err != nil {
		errMsg := fmt.Sprintf("Failed to parse devfile:")
		if strings.Contains(err.Error(), "schemaVersion not present in devfile") {
			errMsg = fmt.Sprintf("%s schemaVersion not present in devfile. Only devfile 2.2.0 or above is supported. The devfile needs to have the schemaVersion set in the metadata section with a value of 2.2.0 or above.", errMsg)
		} else {
			errMsg = fmt.Sprintf("%s %s", errMsg, err)
		}

		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	filterOptions := common.DevfileOptions{
		ComponentOptions: common.ComponentOptions{
			ComponentType: devfilev1.ImageComponentType,
		},
	}

	imageComponents, err := devfileObj.Data.GetComponents(filterOptions) //For Dev Preview, if there is more than one image component err out
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get the image component from devfile: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}
	if len(imageComponents) != 1 {
		errMsg := fmt.Sprintf("Only devfile 2.2.0 or above, with one image component, is supported. ")
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

	dockerfileRelativePath := imageComponents[0].Image.Dockerfile.Uri
	if dockerfileRelativePath == "" {
		errMsg := fmt.Sprintf("Failed to get the Dockerfile location, dockerfile uri is not defined by image component %v", imageComponents[0].Name)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	dockerRelativeSrcContext := imageComponents[0].Image.Dockerfile.BuildContext
	if dockerRelativeSrcContext == "" {
		errMsg := fmt.Sprintf("Failed to get the dockefile context location, dockerfile buildcontext is not defined by image component %v", imageComponents[0].Name)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	dockerImagePort := devfileObj.Data.GetMetadata().Attributes.GetString("alpha.dockerimage-port", &err)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get the Dockerfile location from devfile metadata attribute 'alpha.build-dockerfile': %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	service, err := getService(devfileObj, filterOptions, dockerImagePort)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get service for the devfile: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}

	dockerContextDir := path.Join(data.Git.Dir, dockerRelativeSrcContext)

	devfileResources := devfileResources{
		ImageStream:    getImageStream(),
		BuildResource:  getBuildResource(data, dockerfileRelativePath, dockerContextDir),
		DeployResource: deploymentResource,
		Service:        service,
		Route:          getRouteForDockerImage(data, dockerImagePort),
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

func getService(devfileObj parser.DevfileObj, filterOptions common.DevfileOptions, imagePort string) (corev1.Service, error) {

	serviceParams := generator.ServiceParams{
		TypeMeta: generator.GetTypeMeta("Service", "v1"),
	}

	service, err := generator.GetService(devfileObj, serviceParams, filterOptions)
	if err != nil {
		return corev1.Service{}, err
	}

	portNumber, err := strconv.Atoi(imagePort)
	if err != nil {
		return corev1.Service{}, err
	}

	svcPort := corev1.ServicePort{
		Name:       fmt.Sprintf("http-%v", imagePort),
		Port:       int32(portNumber),
		TargetPort: intstr.FromString(imagePort),
	}
	service.Spec.Ports = append(service.Spec.Ports, svcPort)

	return *service, nil
}

func getRouteForDockerImage(data devfileForm, imagePort string) routev1.Route {

	routeParams := generator.RouteParams{
		TypeMeta: generator.GetTypeMeta("Route", "route.openshift.io/v1"),
		RouteSpecParams: generator.RouteSpecParams{
			ServiceName: data.Name,
			PortNumber:  intstr.FromString(imagePort),
			Path:        "/",
			Secure:      false,
		},
	}

	return *generator.GetRoute(routeParams)
}

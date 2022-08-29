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
	"github.com/devfile/library/pkg/testingutil/filesystem"
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

	deployAssociatedComponents, err := getDeployComponents(devfileObj)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get the deploy command associated components from devfile: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	deploymentResource, err := getDeployResource(devfileObj, deployAssociatedComponents)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get deployment resource for the devfile: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}

	imageBuildComponent, err := getImageBuildComponent(devfileObj, deployAssociatedComponents)
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

	dockerImagePort := devfileObj.Data.GetMetadata().Attributes.GetString("alpha.dockerimage-port", &err)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get the Dockerfile location from devfile metadata attribute 'alpha.build-dockerfile': %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: errMsg})
		return
	}

	imageComponentFilter := common.DevfileOptions{
		ComponentOptions: common.ComponentOptions{
			ComponentType: devfilev1.ImageComponentType,
		},
	}
	service, err := getService(devfileObj, imageComponentFilter, dockerImagePort)
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

func getImageBuildComponent(devfileObj parser.DevfileObj, deployAssociatedComponents map[string]string) (devfilev1.Component, error) {
	imageComponentFilter := common.DevfileOptions{
		ComponentOptions: common.ComponentOptions{
			ComponentType: devfilev1.ImageComponentType,
		},
	}

	imageComponents, err := devfileObj.Data.GetComponents(imageComponentFilter)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get the image component from devfile: %v", err)
		klog.Error(errMsg)
		return devfilev1.Component{}, err
	}

	var imageBuildComponent devfilev1.Component
	imageDeployComponentCount := 0
	for _, component := range imageComponents {
		if _, ok := deployAssociatedComponents[component.Name]; ok && component.Image != nil {
			imageBuildComponent = component
			imageDeployComponentCount++
		}
	}

	// If there is not exactly one image component defined in the deploy command, err out
	if imageDeployComponentCount != 1 {
		errMsg := "expected to find only one devfile image component with a deploy command for build"
		klog.Error(errMsg)
		return devfilev1.Component{}, fmt.Errorf(errMsg)
	}

	return imageBuildComponent, nil
}

func getDeployComponents(devfileObj parser.DevfileObj) (map[string]string, error) {
	deployCommandFilter := common.DevfileOptions{
		CommandOptions: common.CommandOptions{
			CommandGroupKind: devfilev1.DeployCommandGroupKind,
		},
	}
	deployCommands, err := devfileObj.Data.GetCommands(deployCommandFilter)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get the deploy commands from devfile: %v", err)
		klog.Error(errMsg)
		return nil, err
	}

	deployAssociatedComponents := make(map[string]string)
	var deployAssociatedSubCommands []string

	for _, command := range deployCommands {
		if command.Apply != nil {
			if len(deployCommands) > 1 && command.Apply.Group.IsDefault != nil && !*command.Apply.Group.IsDefault {
				continue
			}
			deployAssociatedComponents[command.Apply.Component] = command.Apply.Component
		} else if command.Composite != nil {
			if len(deployCommands) > 1 && command.Composite.Group.IsDefault != nil && !*command.Composite.Group.IsDefault {
				continue
			}
			deployAssociatedSubCommands = append(deployAssociatedSubCommands, command.Composite.Commands...)
		}
	}

	applyCommandFilter := common.DevfileOptions{
		CommandOptions: common.CommandOptions{
			CommandType: devfilev1.ApplyCommandType,
		},
	}
	applyCommands, err := devfileObj.Data.GetCommands(applyCommandFilter)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get the apply commands from devfile: %v", err)
		klog.Error(errMsg)
		return nil, err
	}

	for _, command := range applyCommands {
		if command.Apply != nil {
			for _, deployCommand := range deployAssociatedSubCommands {
				if deployCommand == command.Id {
					deployAssociatedComponents[command.Apply.Component] = command.Apply.Component
				}
			}

		}
	}

	return deployAssociatedComponents, nil
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

func getDeployResource(devfileObj parser.DevfileObj, deployAssociatedComponents map[string]string) (appsv1.Deployment, error) {
	kubernetesComponentFilter := common.DevfileOptions{
		ComponentOptions: common.ComponentOptions{
			ComponentType: devfilev1.KubernetesComponentType,
		},
	}
	kubernetesComponents, err := devfileObj.Data.GetComponents(kubernetesComponentFilter)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get the kubernetes components from devfile: %v", err)
		klog.Error(errMsg)
		return appsv1.Deployment{}, err
	}

	var resources parser.KubernetesResources

	for _, component := range kubernetesComponents {
		if _, ok := deployAssociatedComponents[component.Name]; ok && component.Kubernetes != nil {
			var src parser.YamlSrc

			if component.Kubernetes.Inlined != "" {
				src = parser.YamlSrc{
					Data: []byte(component.Kubernetes.Inlined),
				}
			} else {
				return appsv1.Deployment{}, fmt.Errorf("unable to find the Kuberntes data from the inlined Kubernetes devfile component")
			}

			values, err := parser.ReadKubernetesYaml(src, filesystem.DefaultFs{})
			if err != nil {
				errMsg := fmt.Sprintf("Failed to read the Kubernetes yaml from devfile: %v", err)
				klog.Error(errMsg)
				return appsv1.Deployment{}, err
			}

			resources, err = parser.ParseKubernetesYaml(values)
			if err != nil {
				errMsg := fmt.Sprintf("Failed to parse the Kubernetes yaml data from devfile: %v", err)
				klog.Error(errMsg)
				return appsv1.Deployment{}, err
			}
		}
	}

	if len(resources.Deployments) > 0 {
		return resources.Deployments[0], nil
	}

	return appsv1.Deployment{}, fmt.Errorf("no deployment definition was found in the devfile sample")

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

	return *generator.GetRoute(devfilev1.Endpoint{}, routeParams)
}

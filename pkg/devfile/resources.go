package devfile

import (
	"fmt"
	"strconv"

	devfilev1 "github.com/devfile/api/v2/pkg/apis/workspaces/v1alpha2"
	"github.com/devfile/library/pkg/devfile/generator"
	"github.com/devfile/library/pkg/devfile/parser"
	"github.com/devfile/library/pkg/devfile/parser/data/v2/common"

	buildv1 "github.com/openshift/api/build/v1"
	imagev1 "github.com/openshift/api/image/v1"
	routev1 "github.com/openshift/api/route/v1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/klog"
)

// GetBuildResource gets the build config resource
func GetBuildResource(data DevfileForm, dockerfilePath, contextDir string) buildv1.BuildConfig {

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

// GetDeployResource gets the deployment resource
func GetDeployResource(name string, devfileObj parser.DevfileObj, filterOptions common.DevfileOptions) (appsv1.Deployment, error) {

	containers, err := generator.GetContainers(devfileObj, filterOptions)
	if err != nil {
		return appsv1.Deployment{}, err
	}

	deployParams := generator.DeploymentParams{
		TypeMeta:          generator.GetTypeMeta("Deployment", "apps/v1"),
		Containers:        containers,
		PodSelectorLabels: map[string]string{"app": name},
	}

	deployment, err := generator.GetDeployment(devfileObj, deployParams)
	if err != nil {
		return appsv1.Deployment{}, err
	}

	return *deployment, nil
}

// GetService gets the service resource
func GetService(devfileObj parser.DevfileObj, imagePort string) (corev1.Service, error) {

	serviceParams := generator.ServiceParams{
		TypeMeta: generator.GetTypeMeta("Service", "v1"),
	}

	service, err := generator.GetService(devfileObj, serviceParams, common.DevfileOptions{})
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

// GetRouteForDockerImage gets the route resource
func GetRouteForDockerImage(name string, port, path string, secure bool, annotations map[string]string) routev1.Route {

	if path == "" {
		path = "/"
	}

	routeParams := generator.RouteParams{
		TypeMeta: generator.GetTypeMeta("Route", "route.openshift.io/v1"),
		RouteSpecParams: generator.RouteSpecParams{
			ServiceName: name,
			PortNumber:  intstr.FromString(port),
			Path:        path,
			Secure:      secure,
		},
	}

	return *generator.GetRoute(devfilev1.Endpoint{Annotations: annotations}, routeParams)
}

// GetResourceFromDevfile gets the deployment, service and route resources from the devfile
func GetResourceFromDevfile(devfileObj parser.DevfileObj, deployAssociatedComponents map[string]string, name string) (*appsv1.Deployment, *corev1.Service, *routev1.Route, error) {
	kubernetesComponentFilter := common.DevfileOptions{
		ComponentOptions: common.ComponentOptions{
			ComponentType: devfilev1.KubernetesComponentType,
		},
	}
	kubernetesComponents, err := devfileObj.Data.GetComponents(kubernetesComponentFilter)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get the kubernetes components from devfile: %v", err)
		klog.Error(errMsg)
		return nil, nil, nil, err
	}

	var appendedResources parser.KubernetesResources
	var deployment *appsv1.Deployment
	var service *corev1.Service
	var route *routev1.Route

	for _, component := range kubernetesComponents {
		if _, ok := deployAssociatedComponents[component.Name]; ok && component.Kubernetes != nil {
			if component.Kubernetes.Inlined == "" {
				// If the Kubernetes YAML file does not have inline content, fall back to the dev preview way
				// Once we have resolved the flow between frontend, backend and consume only YAML files,
				// we can err out here instead of falling back

				// Deployment
				deploymentResource, err := GetDeployResource(name, devfileObj, common.DevfileOptions{})
				if err != nil {
					errMsg := fmt.Sprintf("Failed to get Deployment resource for the devfile: %v", err)
					klog.Error(errMsg)
					return nil, nil, nil, err
				}
				appendedResources.Deployments = append(appendedResources.Deployments, deploymentResource)

				dockerImagePort := devfileObj.Data.GetMetadata().Attributes.GetString("alpha.dockerimage-port", &err)
				if err != nil {
					errMsg := fmt.Sprintf("Failed to get the Docker image port from devfile metadata attribute 'alpha.dockerimage-port': %v", err)
					klog.Error(errMsg)

					return nil, nil, nil, err
				}

				// Service
				serviceResource, err := GetService(devfileObj, dockerImagePort)
				if err != nil {
					errMsg := fmt.Sprintf("Failed to get service for the devfile: %v", err)
					klog.Error(errMsg)
					return nil, nil, nil, err
				}
				appendedResources.Services = append(appendedResources.Services, serviceResource)

				// Route
				routeResource := GetRouteForDockerImage(name, dockerImagePort, "/", false, nil)
				appendedResources.Routes = append(appendedResources.Routes, routeResource)

				// break here as we are no longer interested in parsing a YAML file
				break
			}

			src := parser.YamlSrc{
				Data: []byte(component.Kubernetes.Inlined),
			}
			values, err := parser.ReadKubernetesYaml(src, nil)
			if err != nil {
				errMsg := fmt.Sprintf("Failed to read the Kubernetes yaml from devfile: %v", err)
				klog.Error(errMsg)
				return nil, nil, nil, err
			}

			resources, err := parser.ParseKubernetesYaml(values)
			if err != nil {
				errMsg := fmt.Sprintf("Failed to parse the Kubernetes yaml data from devfile: %v", err)
				klog.Error(errMsg)
				return nil, nil, nil, err
			}

			for _, endpoint := range component.Kubernetes.Endpoints {
				if endpoint.Exposure != devfilev1.NoneEndpointExposure && endpoint.Exposure != devfilev1.InternalEndpointExposure {
					var isSecure bool
					if endpoint.Secure != nil {
						isSecure = *endpoint.Secure
					}
					resources.Routes = append(resources.Routes, GetRouteForDockerImage(name, fmt.Sprintf("%d", endpoint.TargetPort), endpoint.Path, isSecure, endpoint.Annotations))
				}
			}

			appendedResources.Deployments = append(appendedResources.Deployments, resources.Deployments...)
			appendedResources.Services = append(appendedResources.Services, resources.Services...)
			appendedResources.Routes = append(appendedResources.Routes, resources.Routes...)
		}
	}

	if len(appendedResources.Deployments) > 0 {
		deployment = &appendedResources.Deployments[0]
	} else {
		err = fmt.Errorf("no deployment definition was found in the devfile sample")
	}

	if len(appendedResources.Services) > 0 {
		service = &appendedResources.Services[0]
	}

	if len(appendedResources.Routes) > 0 {
		route = &appendedResources.Routes[0]
	}

	return deployment, service, route, err
}

// GetImageStream gets the image stream resource
func GetImageStream() imagev1.ImageStream {

	imageStreamParams := generator.ImageStreamParams{
		TypeMeta: generator.GetTypeMeta("ImageStream", "image.openshift.io/v1"),
	}
	imageStream := generator.GetImageStream(imageStreamParams)
	return imageStream
}

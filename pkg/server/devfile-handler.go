package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	buildv1 "github.com/openshift/api/build/v1"
	imagev1 "github.com/openshift/api/image/v1"
	routev1 "github.com/openshift/api/route/v1"
	"github.com/openshift/console/pkg/serverutils"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	intstr "k8s.io/apimachinery/pkg/util/intstr"
)

const (
	dockerfilePath = "random-dockerfileLocation"
)

var (
	data formData
)

func (s *Server) devfileHandler(w http.ResponseWriter, r *http.Request) {
	_ = json.NewDecoder(r.Body).Decode(&data)

	// devfileContentBytes := []byte(data.Devfile.DevfileContent)

	devfileResources := devfileResources{
		ImageStream:    getImageStream(),
		BuildResource:  getBuildResource(),
		DeployResource: getDeployResource(),
		Service:        getService(),
		Route:          getRoute(),
	}

	devfileResourcesJSON, err := json.Marshal(devfileResources)
	if err != nil {
	}

	// devfileResourcesJSONString := string(devfileResourcesJSON)
	// fmt.Printf(devfileResourcesJSONString)

	w.Header().Set("Content-Type", "application/json")
	// w.Write(devfileResourcesJSON)
	serverutils.SendResponse(w, http.StatusOK, struct {
		DevfileResources string `json:"devfileResources"`
	}{
		DevfileResources: string(devfileResourcesJSON),
	})
}

func getImageStream() imagev1.ImageStream {

	imageStream := imagev1.ImageStream{
		TypeMeta:   createTypeMeta("ImageStream", "image.openshift.io/v1"),
		ObjectMeta: createObjectMeta(data.Name, data.Namespace, addmap(data.DefaultLabels, data.UserLabls), data.Annotations),
	}
	return imageStream
}

func getBuildResource() buildv1.BuildConfig {

	buildConfig := buildv1.BuildConfig{
		TypeMeta:   createTypeMeta("BuildConfig", "build.openshift.io/v1"),
		ObjectMeta: createObjectMeta(data.Name, data.Namespace, addmap(data.DefaultLabels, data.UserLabls), data.Annotations),
		Spec: buildv1.BuildConfigSpec{
			CommonSpec: buildv1.CommonSpec{
				Output: buildv1.BuildOutput{
					To: &corev1.ObjectReference{
						Kind: "ImageStreamTag",
						Name: data.Name + ":latest",
					},
				},
				Source: buildv1.BuildSource{
					ContextDir: data.Git.Dir,
					Git: &buildv1.GitBuildSource{
						URI: data.Git.URL,
						Ref: data.Git.Ref,
					},
					// SourceSecret: &corev1.LocalObjectReference{
					// 	Name: data.Git.Secret,
					// },
				},
				Strategy: buildv1.BuildStrategy{
					Type: buildv1.DockerBuildStrategyType,
					DockerStrategy: &buildv1.DockerBuildStrategy{
						DockerfilePath: dockerfilePath,
						Env:            data.Build.Env,
					},
				},
			},
		},
	}
	return buildConfig
}

func getDeployResource() appsv1.Deployment {

	deployment := appsv1.Deployment{
		TypeMeta:   createTypeMeta("Deployment", "apps/v1"),
		ObjectMeta: createObjectMeta(data.Name, data.Namespace, addmap(data.DefaultLabels, data.UserLabls), data.Annotations),
		Spec: appsv1.DeploymentSpec{
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{"app": data.Name},
			},
			Replicas: data.Deployment.Replicas,
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: addmap(data.DefaultLabels, data.UserLabls),
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  data.Name,
							Image: data.Name + ":latest",
							Ports: data.Image.Ports,
							Env:   data.Deployment.Env,
							Resources: corev1.ResourceRequirements{
								Limits:   corev1.ResourceList{},
								Requests: corev1.ResourceList{},
							},
							// LivenessProbe:  &data.Healthchecks.LivenessProbe,
							// ReadinessProbe: &data.Healthchecks.ReadinessProble,
							// StartupProbe:   &data.Healthchecks.StartupProbe,
						},
					},
				},
			},
		},
	}

	return deployment
}

func getService() corev1.Service {

	service := corev1.Service{
		TypeMeta:   createTypeMeta("Service", "v1"),
		ObjectMeta: createObjectMeta(data.Name, data.Namespace, addmap(data.DefaultLabels, data.UserLabls), data.Annotations),
		Spec: corev1.ServiceSpec{
			Selector: data.PodLabels,
			Ports: []corev1.ServicePort{
				{
					Name: fmt.Sprintf("%d-%s", data.Image.Ports[0].ContainerPort, strings.ToLower(fmt.Sprintf("%s", data.Image.Ports[0].Protocol))),
					Port: data.Image.Ports[0].ContainerPort,
					TargetPort: intstr.IntOrString{
						Type:   intstr.Int,
						IntVal: data.Image.Ports[0].ContainerPort,
						StrVal: "",
					},
					Protocol: data.Image.Ports[0].Protocol,
				},
			},
		},
	}
	return service
}

func getRoute() routev1.Route {

	route := routev1.Route{
		TypeMeta:   createTypeMeta("Route", "route.openshift.io/v1"),
		ObjectMeta: createObjectMeta(data.Name, data.Namespace, addmap(data.DefaultLabels, data.UserLabls), data.Annotations),
		Spec: routev1.RouteSpec{
			To: routev1.RouteTargetReference{
				Kind: "Service",
				Name: data.Name,
			},
			Host: data.RouteSpec.Hostname,
			Path: data.RouteSpec.Path,
			Port: &routev1.RoutePort{
				TargetPort: intstr.IntOrString{
					Type:   intstr.String,
					IntVal: int32(0),
					StrVal: fmt.Sprintf("%d-%s", data.Image.Ports[0].ContainerPort, strings.ToLower(fmt.Sprintf("%s", data.Image.Ports[0].Protocol))),
				},
			},
			WildcardPolicy: routev1.WildcardPolicyNone,
		},
	}

	return route
}

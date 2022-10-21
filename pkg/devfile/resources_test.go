package devfile

import (
	"fmt"
	"testing"

	v1 "github.com/devfile/api/v2/pkg/apis/workspaces/v1alpha2"
	"github.com/devfile/api/v2/pkg/attributes"
	devfilePkg "github.com/devfile/api/v2/pkg/devfile"

	buildv1 "github.com/openshift/api/build/v1"

	"github.com/devfile/library/pkg/devfile/parser"
	"github.com/devfile/library/pkg/devfile/parser/data"
	"github.com/devfile/library/pkg/devfile/parser/data/v2/common"
	"github.com/golang/mock/gomock"
	"github.com/stretchr/testify/assert"
)

func TestGetResourceFromDevfile(t *testing.T) {

	componentNames := []string{"testcomp0", "testcomp1", "testcomp2"}

	metadata := devfilePkg.DevfileMetadata{
		Attributes: attributes.Attributes{}.PutString("alpha.dockerimage-port", "8081"),
	}

	badMetadata := devfilePkg.DevfileMetadata{
		Attributes: attributes.Attributes{}.PutString("beta.dockerimage-port", "8081"),
	}

	expectedMockErr := "an expected error"
	noDeploymentErr := "no deployment definition was found in the devfile sample"
	badYAMLErr := "line 1: did not find expected"
	attributeDoesNotExistErr := "Attribute with key \"alpha.dockerimage-port\" does not exist"

	secure := true
	mountSources := false

	events := v1.Events{
		DevWorkspaceEvents: v1.DevWorkspaceEvents{
			PreStart: []string{},
			PostStop: []string{},
		},
	}

	tests := []struct {
		name                       string
		kubeComponents             []v1.Component
		containerComponents        []v1.Component
		deployAssociatedComponents map[string]string
		applicationName            string
		wantDeploymentName         string
		wantServiceName            string
		wantRouteServiceName       string
		wantMockErr1               *string
		wantMockErr2               *string
		wantMockErr2_1             *string
		wantMockErr3               *string
		wantErr                    *string
	}{
		{
			name: "Correct deployment, service and route from a single YAML",
			kubeComponents: []v1.Component{
				{
					Name: componentNames[0],
					ComponentUnion: v1.ComponentUnion{
						Kubernetes: &v1.KubernetesComponent{
							K8sLikeComponent: v1.K8sLikeComponent{
								K8sLikeComponentLocation: v1.K8sLikeComponentLocation{
									Inlined: `
kind: Deployment
apiVersion: apps/v1
metadata:
  name: my-python-deploy
spec:
  replicas: 1
  selector:
    matchLabels:
      app: python-app
  template:
    metadata:
      labels:
        app: python-app
    spec:
      containers:
        - name: my-python
          image: python-image:latest
          ports:
            - name: http
              containerPort: 8081
              protocol: TCP
          resources:
            limits:
              memory: "128Mi"
              cpu: "500m"
---
kind: Service
apiVersion: v1
metadata:
  name: my-python-svc
spec:
ports:
  - name: http-8081
    port: 8081
    protocol: TCP
    targetPort: 8081
selector:
  app: python-app`,
								},
								Endpoints: []v1.Endpoint{
									{
										Name:       "http-outerloop",
										TargetPort: 8081,
										Path:       "/",
									},
								},
							},
						},
					},
				},
				{
					Name: componentNames[1],
					ComponentUnion: v1.ComponentUnion{
						Kubernetes: &v1.KubernetesComponent{
							K8sLikeComponent: v1.K8sLikeComponent{
								K8sLikeComponentLocation: v1.K8sLikeComponentLocation{
									Uri: "uri",
								},
							},
						},
					},
				},
			},
			deployAssociatedComponents: map[string]string{
				componentNames[0]: componentNames[0],
			},
			applicationName:      "my-python",
			wantDeploymentName:   "my-python-deploy",
			wantServiceName:      "my-python-svc",
			wantRouteServiceName: "my-python",
		},
		{
			name: "Correct deployment, service and route from different YAMLs",
			kubeComponents: []v1.Component{
				{
					Name: componentNames[0],
					ComponentUnion: v1.ComponentUnion{
						Kubernetes: &v1.KubernetesComponent{
							K8sLikeComponent: v1.K8sLikeComponent{
								K8sLikeComponentLocation: v1.K8sLikeComponentLocation{
									Inlined: `
kind: Deployment
apiVersion: apps/v1
metadata:
  name: my-python-deploy
spec:
  replicas: 1
  selector:
    matchLabels:
      app: python-app
  template:
    metadata:
      labels:
        app: python-app
    spec:
      containers:
        - name: my-python
          image: python-image:latest
          ports:
            - name: http
              containerPort: 8081
              protocol: TCP
          resources:
            limits:
              memory: "128Mi"
              cpu: "500m"`,
								},
							},
						},
					},
				},
				{
					Name: componentNames[1],
					ComponentUnion: v1.ComponentUnion{
						Kubernetes: &v1.KubernetesComponent{
							K8sLikeComponent: v1.K8sLikeComponent{
								K8sLikeComponentLocation: v1.K8sLikeComponentLocation{
									Inlined: `
kind: Service
apiVersion: v1
metadata:
  name: my-python-svc
spec:
ports:
  - name: http-8081
    port: 8081
    protocol: TCP
    targetPort: 8081
selector:
  app: python-app`,
								},
								Endpoints: []v1.Endpoint{
									{
										Name:       "http-outerloop",
										TargetPort: 8081,
										Secure:     &secure,
									},
								},
							},
						},
					},
				},
			},
			deployAssociatedComponents: map[string]string{
				componentNames[0]: componentNames[0],
				componentNames[1]: componentNames[1],
			},
			applicationName:      "my-python",
			wantDeploymentName:   "my-python-deploy",
			wantServiceName:      "my-python-svc",
			wantRouteServiceName: "my-python",
		},
		{
			name: "Correct deployment, missing service and route",
			kubeComponents: []v1.Component{
				{
					Name: componentNames[0],
					ComponentUnion: v1.ComponentUnion{
						Kubernetes: &v1.KubernetesComponent{
							K8sLikeComponent: v1.K8sLikeComponent{
								K8sLikeComponentLocation: v1.K8sLikeComponentLocation{
									Inlined: `
kind: Deployment
apiVersion: apps/v1
metadata:
  name: my-python-deploy
spec:
  replicas: 1
  selector:
    matchLabels:
      app: python-app
  template:
    metadata:
      labels:
        app: python-app
    spec:
      containers:
        - name: my-python
          image: python-image:latest
          ports:
            - name: http
              containerPort: 8081
              protocol: TCP
          resources:
            limits:
              memory: "128Mi"
              cpu: "500m"`,
								},
							},
						},
					},
				},
			},
			deployAssociatedComponents: map[string]string{
				componentNames[0]: componentNames[0],
			},
			applicationName:      "my-python",
			wantDeploymentName:   "my-python-deploy",
			wantServiceName:      "",
			wantRouteServiceName: "",
		},
		{
			name: "Correct service and route, missing deployment",
			kubeComponents: []v1.Component{
				{
					Name: componentNames[0],
					ComponentUnion: v1.ComponentUnion{
						Kubernetes: &v1.KubernetesComponent{
							K8sLikeComponent: v1.K8sLikeComponent{
								K8sLikeComponentLocation: v1.K8sLikeComponentLocation{
									Inlined: `
kind: Service
apiVersion: v1
metadata:
  name: my-python-svc
spec:
ports:
  - name: http-8081
    port: 8081
    protocol: TCP
    targetPort: 8081
selector:
  app: python-app`,
								},
								Endpoints: []v1.Endpoint{
									{
										Name:       "http-outerloop",
										TargetPort: 8081,
										Path:       "/",
									},
								},
							},
						},
					},
				},
			},
			deployAssociatedComponents: map[string]string{
				componentNames[0]: componentNames[0],
			},
			applicationName: "my-python",
			wantErr:         &noDeploymentErr,
		},
		{
			name: "Bad YAML",
			kubeComponents: []v1.Component{
				{
					Name: componentNames[0],
					ComponentUnion: v1.ComponentUnion{
						Kubernetes: &v1.KubernetesComponent{
							K8sLikeComponent: v1.K8sLikeComponent{
								K8sLikeComponentLocation: v1.K8sLikeComponentLocation{
									Inlined: `
{} kind: Deployment
apiVersion: apps/v1
metadata:
  name: my-python-deploy
spec:
  replicas: 1
  selector:
    matchLabels:
      app: python-app
  template:
    metadata:
      labels:
        app: python-app
    spec:
      containers:
        - name: my-python
          image: python-image:latest`,
								},
								Endpoints: []v1.Endpoint{
									{
										Name:       "http-outerloop",
										TargetPort: 8081,
										Path:       "/",
									},
								},
							},
						},
					},
				},
			},
			deployAssociatedComponents: map[string]string{
				componentNames[0]: componentNames[0],
			},
			applicationName: "my-python",
			wantErr:         &badYAMLErr,
		},
		{
			name: "Correct deployment, service and route from attribute",
			kubeComponents: []v1.Component{
				{
					Name: componentNames[0],
					ComponentUnion: v1.ComponentUnion{
						Kubernetes: &v1.KubernetesComponent{
							K8sLikeComponent: v1.K8sLikeComponent{
								K8sLikeComponentLocation: v1.K8sLikeComponentLocation{
									Uri: "uri",
								},
							},
						},
					},
				},
				{
					Name: componentNames[1],
					ComponentUnion: v1.ComponentUnion{
						Kubernetes: &v1.KubernetesComponent{
							K8sLikeComponent: v1.K8sLikeComponent{
								K8sLikeComponentLocation: v1.K8sLikeComponentLocation{
									Uri: "uri",
								},
							},
						},
					},
				},
			},
			containerComponents: []v1.Component{
				{
					Name: "container0",
					ComponentUnion: v1.ComponentUnion{
						Container: &v1.ContainerComponent{
							Container: v1.Container{
								Image:        "image",
								MountSources: &mountSources,
							},
							Endpoints: []v1.Endpoint{
								{
									Name:       "http",
									TargetPort: 8081,
									Path:       "/",
								},
							},
						},
					},
				},
			},
			deployAssociatedComponents: map[string]string{
				componentNames[0]: componentNames[0],
			},
			applicationName:      "my-python",
			wantDeploymentName:   "my-python-deploy",
			wantServiceName:      "my-python-svc",
			wantRouteServiceName: "my-python",
		},
		{
			name:         "Simulating error case with kubernetes component filter, check if error matches",
			wantMockErr1: &expectedMockErr,
			wantErr:      &expectedMockErr,
		},
		{
			name: "Simulating error case with metadata attribute getter, check if error matches",
			kubeComponents: []v1.Component{
				{
					Name: componentNames[0],
					ComponentUnion: v1.ComponentUnion{
						Kubernetes: &v1.KubernetesComponent{
							K8sLikeComponent: v1.K8sLikeComponent{
								K8sLikeComponentLocation: v1.K8sLikeComponentLocation{
									Uri: "uri",
								},
							},
						},
					},
				},
			},
			containerComponents: []v1.Component{
				{
					Name: "container0",
					ComponentUnion: v1.ComponentUnion{
						Container: &v1.ContainerComponent{
							Container: v1.Container{
								Image:        "image",
								MountSources: &mountSources,
							},
							Endpoints: []v1.Endpoint{
								{
									Name:       "http",
									TargetPort: 8081,
									Path:       "/",
								},
							},
						},
					},
				},
			},
			deployAssociatedComponents: map[string]string{
				componentNames[0]: componentNames[0],
			},
			applicationName: "my-python",
			wantMockErr3:    &attributeDoesNotExistErr,
			wantErr:         &attributeDoesNotExistErr,
		},
		{
			name: "Simulating error case with GetContainers, check if error matches",
			kubeComponents: []v1.Component{
				{
					Name: componentNames[0],
					ComponentUnion: v1.ComponentUnion{
						Kubernetes: &v1.KubernetesComponent{
							K8sLikeComponent: v1.K8sLikeComponent{
								K8sLikeComponentLocation: v1.K8sLikeComponentLocation{
									Uri: "uri",
								},
							},
						},
					},
				},
			},
			containerComponents: []v1.Component{
				{
					Name: "container0",
					ComponentUnion: v1.ComponentUnion{
						Container: &v1.ContainerComponent{
							Container: v1.Container{
								Image:        "image",
								MountSources: &mountSources,
							},
							Endpoints: []v1.Endpoint{
								{
									Name:       "http",
									TargetPort: 8081,
									Path:       "/",
								},
							},
						},
					},
				},
			},
			deployAssociatedComponents: map[string]string{
				componentNames[0]: componentNames[0],
			},
			applicationName: "my-python",
			wantMockErr2:    &expectedMockErr,
			wantErr:         &expectedMockErr,
		},
		{
			name: "Simulating error case with GetService, check if error matches",
			kubeComponents: []v1.Component{
				{
					Name: componentNames[0],
					ComponentUnion: v1.ComponentUnion{
						Kubernetes: &v1.KubernetesComponent{
							K8sLikeComponent: v1.K8sLikeComponent{
								K8sLikeComponentLocation: v1.K8sLikeComponentLocation{
									Uri: "uri",
								},
							},
						},
					},
				},
			},
			containerComponents: []v1.Component{
				{
					Name: "container0",
					ComponentUnion: v1.ComponentUnion{
						Container: &v1.ContainerComponent{
							Container: v1.Container{
								Image:        "image",
								MountSources: &mountSources,
							},
							Endpoints: []v1.Endpoint{
								{
									Name:       "http",
									TargetPort: 8081,
									Path:       "/",
								},
							},
						},
					},
				},
			},
			deployAssociatedComponents: map[string]string{
				componentNames[0]: componentNames[0],
			},
			applicationName: "my-python",
			wantMockErr2_1:  &expectedMockErr,
			wantErr:         &expectedMockErr,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			ctrl := gomock.NewController(t)
			defer ctrl.Finish()
			mockDevfileData := data.NewMockDevfileData(ctrl)

			// set up the mock data
			kubernetesComponentFilter := common.DevfileOptions{
				ComponentOptions: common.ComponentOptions{
					ComponentType: v1.KubernetesComponentType,
				},
			}
			// required for call in GetResourceFromDevfile()
			mockKubernetesComponents := mockDevfileData.EXPECT().GetComponents(kubernetesComponentFilter)
			mockKubernetesComponents.Return(tt.kubeComponents, nil).AnyTimes()
			if tt.wantMockErr1 != nil {
				mockKubernetesComponents.Return(nil, fmt.Errorf(*tt.wantMockErr1))
			}

			containerComponentFilter := common.DevfileOptions{
				ComponentOptions: common.ComponentOptions{
					ComponentType: v1.ContainerComponentType,
				},
			}
			// required for call in GetResourceFromDevfile().GetDeployResource().GetContainers()
			mockContainerComponents := mockDevfileData.EXPECT().GetComponents(containerComponentFilter)
			mockContainerComponents.Return(tt.containerComponents, nil).AnyTimes()
			if tt.wantMockErr2 != nil {
				mockContainerComponents.Return(nil, fmt.Errorf(*tt.wantMockErr2)).MaxTimes(1)
			} else if tt.wantMockErr2_1 != nil {
				mockContainerComponents2 := mockDevfileData.EXPECT().GetComponents(containerComponentFilter)
				mockContainerComponents2.Return(nil, fmt.Errorf(*tt.wantMockErr2_1)).After(mockContainerComponents.Times(2))
			}

			// required for call in GetResourceFromDevfile().GetDeployResource().GetContainers()
			mockDevfileData.EXPECT().GetEvents().Return(events).AnyTimes()

			mockMetadata := mockDevfileData.EXPECT().GetMetadata()
			mockMetadata.Return(metadata).AnyTimes()
			if tt.wantMockErr3 != nil {
				mockMetadata.Return(badMetadata)
			}

			devObj := parser.DevfileObj{
				Data: mockDevfileData,
			}

			actualDeployment, actualService, actualRoute, err := GetResourceFromDevfile(devObj, tt.deployAssociatedComponents, tt.applicationName)
			// Unexpected error
			if (err != nil) != (tt.wantErr != nil) {
				t.Errorf("TestGetResourceFromDevfile() error: %v, wantErr %v", err, tt.wantErr)
			} else if err == nil {
				if tt.name == "Correct deployment, service and route from attribute" {
					assert.NotNil(t, actualDeployment, "expected deployment to be not nil")
					assert.Equal(t, 1, len(actualDeployment.Spec.Template.Spec.Containers), "expected to have one container")
					assert.Equal(t, "image", actualDeployment.Spec.Template.Spec.Containers[0].Image, "received the wrong container image")
					assert.NotNil(t, actualService, "expected service to be not nil")
					assert.GreaterOrEqual(t, len(actualService.Spec.Ports), 1)
					assert.Equal(t, int32(8081), actualService.Spec.Ports[0].Port, "received the wrong port")
				} else {
					if tt.wantDeploymentName != "" {
						assert.NotNil(t, actualDeployment, "expected deployment to be not nil")
						assert.Equal(t, tt.wantDeploymentName, actualDeployment.Name, "received the wrong deployment")
					} else {
						assert.Nil(t, actualDeployment, "expected deployment to be nil")
					}

					if tt.wantServiceName != "" {
						assert.NotNil(t, actualService, "expected service to be not nil")
						assert.Equal(t, tt.wantServiceName, actualService.Name, "received the wrong service")
					} else {
						assert.Nil(t, actualService, "expected service to be nil")
					}
				}
				if tt.wantRouteServiceName != "" {
					assert.NotNil(t, actualRoute, "expected route to be not nil")
					assert.Equal(t, tt.wantRouteServiceName, actualRoute.Spec.To.Name, "received the wrong route")
				} else {
					assert.Nil(t, actualRoute, "expected route to be nil")
				}
			} else {
				assert.Regexp(t, *tt.wantErr, err.Error(), "TestGetResourceFromDevfile(): Error message does not match")
			}
		})
	}
}

func TestGetImageStream(t *testing.T) {
	t.Run("Get ImageStream", func(t *testing.T) {
		actualImageStream := GetImageStream()
		assert.Equal(t, "ImageStream", actualImageStream.Kind, "Kind did not match")
		assert.Equal(t, "image.openshift.io/v1", actualImageStream.APIVersion, "APIVersion did not match")
	})
}

func TestGetBuildResource(t *testing.T) {

	var (
		name = "Get the correct Build Config"
		data = DevfileForm{
			Name: "my-python",
			Git: GitData{
				URL: "url",
				Ref: "ref",
				Dir: "/",
			},
		}
		dockerfilePath = "/path/to/dockerfile"
		context        = "/path/to/context"
	)
	t.Run(name, func(t *testing.T) {
		actualBuildConfig := GetBuildResource(data, dockerfilePath, context)
		assert.Equal(t, "BuildConfig", actualBuildConfig.Kind, "Kind did not match")
		assert.Equal(t, "build.openshift.io/v1", actualBuildConfig.APIVersion, "APIVersion did not match")
		assert.NotNil(t, actualBuildConfig.Spec.CommonSpec.Output.To, "Output.To cannot be nil")
		assert.Equal(t, "ImageStreamTag", actualBuildConfig.Spec.CommonSpec.Output.To.Kind, "Output.To.Kind did not match")
		assert.Equal(t, data.Name+":latest:latest", actualBuildConfig.Spec.CommonSpec.Output.To.Name, "Output.To.Name did not match")
		assert.NotNil(t, actualBuildConfig.Spec.CommonSpec.Source.Git, "Source.Git cannot be nil")
		assert.Equal(t, data.Git.URL, actualBuildConfig.Spec.CommonSpec.Source.Git.URI, "Source.Git.URI did not match")
		assert.Equal(t, data.Git.Ref, actualBuildConfig.Spec.CommonSpec.Source.Git.Ref, "Source.Git.Ref did not match")
		assert.Equal(t, context, actualBuildConfig.Spec.CommonSpec.Source.ContextDir, "Source.ContextDir did not match")
		assert.Equal(t, buildv1.DockerBuildStrategyType, actualBuildConfig.Spec.CommonSpec.Strategy.Type, "Source.ContextDir did not match")
		assert.NotNil(t, actualBuildConfig.Spec.CommonSpec.Strategy.DockerStrategy, "DockerStrategy cannot be nil")
		assert.Equal(t, dockerfilePath, actualBuildConfig.Spec.CommonSpec.Strategy.DockerStrategy.DockerfilePath, "DockerStrategy.DockerfilePath did not match")
	})
}

package devfile

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"

	v1 "github.com/devfile/api/v2/pkg/apis/workspaces/v1alpha2"
	"github.com/devfile/library/pkg/devfile/parser"
	"github.com/devfile/library/pkg/devfile/parser/data"
	"github.com/devfile/library/pkg/devfile/parser/data/v2/common"
	"github.com/golang/mock/gomock"
)

func TestGetImageBuildComponent(t *testing.T) {

	componentNames := []string{"testcomp1", "testcomp2", "testcomp3"}

	expectedMockErr := "an expected error"
	multipleComponentsErr := "Currently there is more than one image component"
	noComponentsErr := "Currently there is no image component"

	tests := []struct {
		name                       string
		components                 []v1.Component
		deployAssociatedComponents map[string]string
		wantComponentName          string
		wantMockErr                *string
		wantErr                    *string
	}{
		{
			name: "Correct Image component",
			components: []v1.Component{
				{
					Name: componentNames[0],
					ComponentUnion: v1.ComponentUnion{
						Image: &v1.ImageComponent{
							Image: v1.Image{
								ImageUnion: v1.ImageUnion{
									Dockerfile: &v1.DockerfileImage{
										DockerfileSrc: v1.DockerfileSrc{
											Uri: "uri",
										},
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
				{
					Name: componentNames[2],
					ComponentUnion: v1.ComponentUnion{
						Image: &v1.ImageComponent{
							Image: v1.Image{
								ImageUnion: v1.ImageUnion{
									Dockerfile: &v1.DockerfileImage{
										DockerfileSrc: v1.DockerfileSrc{
											Uri: "uri",
										},
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
			wantComponentName: componentNames[0],
		},
		{
			name:        "Simulating error case, check if error matches",
			wantMockErr: &expectedMockErr,
			wantErr:     &expectedMockErr,
		},
		{
			name: "Multiple Image component",
			components: []v1.Component{
				{
					Name: componentNames[0],
					ComponentUnion: v1.ComponentUnion{
						Image: &v1.ImageComponent{
							Image: v1.Image{
								ImageUnion: v1.ImageUnion{
									Dockerfile: &v1.DockerfileImage{
										DockerfileSrc: v1.DockerfileSrc{
											Uri: "uri",
										},
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
				{
					Name: componentNames[2],
					ComponentUnion: v1.ComponentUnion{
						Image: &v1.ImageComponent{
							Image: v1.Image{
								ImageUnion: v1.ImageUnion{
									Dockerfile: &v1.DockerfileImage{
										DockerfileSrc: v1.DockerfileSrc{
											Uri: "uri",
										},
									},
								},
							},
						},
					},
				},
			},
			deployAssociatedComponents: map[string]string{
				componentNames[0]: componentNames[0],
				componentNames[2]: componentNames[2],
			},
			wantErr: &multipleComponentsErr,
		},
		{
			name:       "No Image component",
			components: []v1.Component{},
			deployAssociatedComponents: map[string]string{
				componentNames[0]: componentNames[0],
				componentNames[2]: componentNames[2],
			},
			wantErr: &noComponentsErr,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			ctrl := gomock.NewController(t)
			defer ctrl.Finish()
			mockDevfileData := data.NewMockDevfileData(ctrl)

			imageComponentFilter := common.DevfileOptions{
				ComponentOptions: common.ComponentOptions{
					ComponentType: v1.ImageComponentType,
				},
			}
			mockGetComponents := mockDevfileData.EXPECT().GetComponents(imageComponentFilter)

			// set up the mock data
			mockGetComponents.Return(tt.components, nil).AnyTimes()
			if tt.wantMockErr != nil {
				mockGetComponents.Return(nil, fmt.Errorf(*tt.wantMockErr))
			}

			devObj := parser.DevfileObj{
				Data: mockDevfileData,
			}

			component, err := GetImageBuildComponent(devObj, tt.deployAssociatedComponents)
			// Unexpected error
			if (err != nil) != (tt.wantErr != nil) {
				t.Errorf("TestGetImageBuildComponent() error: %v, wantErr %v", err, tt.wantErr)
			} else if err == nil {
				assert.Equal(t, tt.wantComponentName, component.Name, "received the wrong component")
			} else {
				assert.Regexp(t, *tt.wantErr, err.Error(), "TestGetImageBuildComponent(): Error message does not match")
			}
		})
	}

}

func TestGetDeployComponents(t *testing.T) {

	componentNames := []string{"testcomp0", "testcomp1", "testcomp2"}

	expectedMockErr := "an expected error"

	isDefault := true
	notDefault := false

	tests := []struct {
		name                           string
		applyCommands                  []v1.Command
		deployCommands                 []v1.Command
		wantDeployAssociatedComponents map[string]string
		wantMockErr1                   *string
		wantMockErr2                   *string
		wantErr                        *string
	}{
		{
			name: "Correct deploy components",
			applyCommands: []v1.Command{
				{
					Id: "apply0",
					CommandUnion: v1.CommandUnion{
						Apply: &v1.ApplyCommand{
							Component: componentNames[0],
							LabeledCommand: v1.LabeledCommand{
								BaseCommand: v1.BaseCommand{
									Group: &v1.CommandGroup{
										Kind:      v1.DeployCommandGroupKind,
										IsDefault: &isDefault,
									},
								},
							},
						},
					},
				},
				{
					Id: "apply1",
					CommandUnion: v1.CommandUnion{
						Apply: &v1.ApplyCommand{
							Component: componentNames[1],
						},
					},
				},
				{
					Id: "apply2",
					CommandUnion: v1.CommandUnion{
						Apply: &v1.ApplyCommand{
							Component: componentNames[2],
						},
					},
				},
			},
			deployCommands: []v1.Command{
				{
					Id: "applynotdefault",
					CommandUnion: v1.CommandUnion{
						Apply: &v1.ApplyCommand{
							Component: componentNames[0],
							LabeledCommand: v1.LabeledCommand{
								BaseCommand: v1.BaseCommand{
									Group: &v1.CommandGroup{
										Kind:      v1.DeployCommandGroupKind,
										IsDefault: &notDefault,
									},
								},
							},
						},
					},
				},
				{
					Id: "apply0",
					CommandUnion: v1.CommandUnion{
						Apply: &v1.ApplyCommand{
							Component: componentNames[0],
							LabeledCommand: v1.LabeledCommand{
								BaseCommand: v1.BaseCommand{
									Group: &v1.CommandGroup{
										Kind: v1.DeployCommandGroupKind,
									},
								},
							},
						},
					},
				},
				{
					Id: "composite1",
					CommandUnion: v1.CommandUnion{
						Composite: &v1.CompositeCommand{
							Commands: []string{"apply0", "apply2"},
							LabeledCommand: v1.LabeledCommand{
								BaseCommand: v1.BaseCommand{
									Group: &v1.CommandGroup{
										Kind:      v1.DeployCommandGroupKind,
										IsDefault: &isDefault,
									},
								},
							},
						},
					},
				},
				{
					Id: "compositenotdefault",
					CommandUnion: v1.CommandUnion{
						Composite: &v1.CompositeCommand{
							Commands: []string{"apply0", "apply2"},
							LabeledCommand: v1.LabeledCommand{
								BaseCommand: v1.BaseCommand{
									Group: &v1.CommandGroup{
										Kind:      v1.DeployCommandGroupKind,
										IsDefault: &notDefault,
									},
								},
							},
						},
					},
				},
			},
			wantDeployAssociatedComponents: map[string]string{
				componentNames[0]: componentNames[0],
				componentNames[2]: componentNames[2],
			},
		},
		{
			name:         "Simulating error case with deploy filter, check if error matches",
			wantMockErr1: &expectedMockErr,
			wantErr:      &expectedMockErr,
		},
		{
			name:         "Simulating error case with apply filter, check if error matches",
			wantMockErr2: &expectedMockErr,
			wantErr:      &expectedMockErr,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			ctrl := gomock.NewController(t)
			defer ctrl.Finish()
			mockDevfileData := data.NewMockDevfileData(ctrl)

			// set up the mock data
			deployCommandFilter := common.DevfileOptions{
				CommandOptions: common.CommandOptions{
					CommandGroupKind: v1.DeployCommandGroupKind,
				},
			}
			mockDeployCommands := mockDevfileData.EXPECT().GetCommands(deployCommandFilter)
			mockDeployCommands.Return(tt.deployCommands, nil).AnyTimes()
			if tt.wantMockErr1 != nil {
				mockDeployCommands.Return(nil, fmt.Errorf(*tt.wantMockErr1))
			}

			applyCommandFilter := common.DevfileOptions{
				CommandOptions: common.CommandOptions{
					CommandType: v1.ApplyCommandType,
				},
			}
			mockApplyCommands := mockDevfileData.EXPECT().GetCommands(applyCommandFilter)
			mockApplyCommands.Return(tt.applyCommands, nil).AnyTimes()
			if tt.wantMockErr2 != nil {
				mockApplyCommands.Return(nil, fmt.Errorf(*tt.wantMockErr2))
			}

			devObj := parser.DevfileObj{
				Data: mockDevfileData,
			}

			componentMap, err := GetDeployComponents(devObj)
			// Unexpected error
			if (err != nil) != (tt.wantErr != nil) {
				t.Errorf("TestGetDeployComponents() error: %v, wantErr %v", err, tt.wantErr)
			} else if err == nil {
				assert.Equal(t, tt.wantDeployAssociatedComponents, componentMap, "received the wrong components")
			} else {
				assert.Regexp(t, *tt.wantErr, err.Error(), "TestGetDeployComponents(): Error message does not match")
			}
		})
	}

}

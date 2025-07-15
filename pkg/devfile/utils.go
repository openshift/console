package devfile

import (
	"fmt"
	"reflect"

	"k8s.io/klog/v2"

	devfilev1 "github.com/devfile/api/v2/pkg/apis/workspaces/v1alpha2"
	"github.com/devfile/library/v2/pkg/devfile/parser"
	"github.com/devfile/library/v2/pkg/devfile/parser/data/v2/common"
)

// GetImageBuildComponent gets the image build component from the deploy associated components
func GetImageBuildComponent(devfileObj parser.DevfileObj, deployAssociatedComponents map[string]string) (devfilev1.Component, error) {
	imageComponentFilter := common.DevfileOptions{
		ComponentOptions: common.ComponentOptions{
			ComponentType: devfilev1.ImageComponentType,
		},
	}

	imageComponents, err := devfileObj.Data.GetComponents(imageComponentFilter)
	if err != nil {
		err := fmt.Errorf("failed to get the image component from devfile: %w", err)
		klog.Error(err.Error())
		return devfilev1.Component{}, err
	}

	var imageBuildComponent devfilev1.Component
	for _, component := range imageComponents {
		if _, ok := deployAssociatedComponents[component.Name]; ok && component.Image != nil {
			if reflect.DeepEqual(imageBuildComponent, devfilev1.Component{}) {
				imageBuildComponent = component
			} else {
				err := fmt.Errorf("expected to find one devfile image component with a deploy command for build. Currently there is more than one image component")
				klog.Error(err.Error())
				return devfilev1.Component{}, err
			}
		}
	}

	// If there is not one image component defined in the deploy command, err out
	if reflect.DeepEqual(imageBuildComponent, devfilev1.Component{}) {
		err := fmt.Errorf("expected to find one devfile image component with a deploy command for build. Currently there is no image component")
		klog.Error(err.Error())
		return devfilev1.Component{}, err
	}

	return imageBuildComponent, nil
}

// GetDeployComponents gets the default deploy command associated components
func GetDeployComponents(devfileObj parser.DevfileObj) (map[string]string, error) {
	deployCommandFilter := common.DevfileOptions{
		CommandOptions: common.CommandOptions{
			CommandGroupKind: devfilev1.DeployCommandGroupKind,
		},
	}
	deployCommands, err := devfileObj.Data.GetCommands(deployCommandFilter)
	if err != nil {
		err := fmt.Errorf("failed to get the deploy commands from devfile: %w", err)
		klog.Error(err.Error())
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
		err := fmt.Errorf("failed to get the apply commands from devfile: %w", err)
		klog.Error(err.Error())
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

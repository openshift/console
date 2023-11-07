package tool

import (
	"context"
	"embed"
	"errors"
	"fmt"
	"time"

	"github.com/Masterminds/semver"
	"gopkg.in/yaml.v3"
	"helm.sh/helm/v3/pkg/cli"
	v1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	"k8s.io/apimachinery/pkg/version"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/kubectl/pkg/scheme"

	"github.com/redhat-certification/chart-verifier/internal/chartverifier/utils"
)

//go:embed kubeOpenShiftVersionMap.yaml
var content embed.FS

// Based on https://access.redhat.com/solutions/4870701
var (
	kubeOpenShiftVersionMap map[string]string
	listDeployments         = getDeploymentsList
	listDaemonSets          = getDaemonSetsList
	listStatefulSets        = getStatefulSetsList
	latestKubeVersion       *semver.Version
)

type versionMap struct {
	Versions []*versionMapping `yaml:"versions"`
}

type versionMapping struct {
	KubeVersion string `yaml:"kube-version"`
	OcpVersion  string `yaml:"ocp-version"`
}

type workloadNotReady struct {
	ResourceType string
	Name         string
	Unavailable  int32
}

func init() {
	kubeOpenShiftVersionMap = make(map[string]string)

	yamlFile, err := content.ReadFile("kubeOpenShiftVersionMap.yaml")
	if err != nil {
		utils.LogError(fmt.Sprintf("Error reading content of kubeOpenShiftVersionMap.yaml: %v", err))
		return
	}

	versions := versionMap{}
	err = yaml.Unmarshal(yamlFile, &versions)
	if err != nil {
		utils.LogError(fmt.Sprintf("Error reading content of kubeOpenShiftVersionMap.yaml: %v", err))
		return
	}

	latestKubeVersion, _ = semver.NewVersion("0.0")
	for _, versionMap := range versions.Versions {
		currentVersion, _ := semver.NewVersion(versionMap.KubeVersion)
		if currentVersion.GreaterThan(latestKubeVersion) {
			latestKubeVersion = currentVersion
		}
		kubeOpenShiftVersionMap[versionMap.KubeVersion] = versionMap.OcpVersion
	}
}

type Kubectl struct {
	clientset kubernetes.Interface
}

func NewKubectl(kubeConfig clientcmd.ClientConfig) (*Kubectl, error) {
	config, err := kubeConfig.ClientConfig()
	if err != nil {
		return nil, err
	}

	config.APIPath = "/api"
	config.GroupVersion = &schema.GroupVersion{Group: "core", Version: "v1"}
	config.NegotiatedSerializer = serializer.WithoutConversionCodecFactory{CodecFactory: scheme.Codecs}
	kubectl := new(Kubectl)
	kubectl.clientset, err = kubernetes.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	return kubectl, nil
}

// WaitForWorkloadResources returns nil when all pods for requested workload resources are confirmed ready
// or an error if resources cannot be confirmed ready before the timeout is exceeded.
// Currently checks deployments, daemonSets, and statefulSets.
func (k Kubectl) WaitForWorkloadResources(context context.Context, namespace string, selector string) error {
	deadline, _ := context.Deadline()
	unavailableWorkloadResources := []workloadNotReady{{Name: "none", Unavailable: 1}}
	getWorkloadResourceError := ""

	// Loop until timeout reached or all requested pods are available
	utils.LogInfo(fmt.Sprintf("Start wait for workloads resources. --timeout time left: %s ", time.Until(deadline).String()))
	for deadline.After(time.Now()) && len(unavailableWorkloadResources) > 0 {
		unavailableWorkloadResources = []workloadNotReady{}

		deployments, errDeployments := listDeployments(k, context, namespace, selector)
		daemonSets, errDaemonSets := listDaemonSets(k, context, namespace, selector)
		statefulSets, errStatefulSets := listStatefulSets(k, context, namespace, selector)

		// Inspect the resources that are successfully returned or handle API request errors
		if errDeployments == nil && errDaemonSets == nil && errStatefulSets == nil {
			getWorkloadResourceError = ""
			// Check the number of unavailable replicas for each workload type
			for _, deployment := range deployments {
				if deployment.Status.UnavailableReplicas > 0 {
					unavailableWorkloadResources = append(unavailableWorkloadResources, workloadNotReady{Name: deployment.Name, ResourceType: "Deployment", Unavailable: deployment.Status.UnavailableReplicas})
				}
			}
			for _, daemonSet := range daemonSets {
				if daemonSet.Status.NumberUnavailable > 0 {
					unavailableWorkloadResources = append(unavailableWorkloadResources, workloadNotReady{Name: daemonSet.Name, ResourceType: "DaemonSet", Unavailable: daemonSet.Status.NumberUnavailable})
				}
			}
			for _, statefulSet := range statefulSets {
				// StatefulSet doesn't report unavailable replicas so it is calculated here
				unavailableReplicas := statefulSet.Status.Replicas - statefulSet.Status.AvailableReplicas
				if unavailableReplicas > 0 {
					unavailableWorkloadResources = append(unavailableWorkloadResources, workloadNotReady{Name: statefulSet.Name, ResourceType: "StatefulSet", Unavailable: unavailableReplicas})
				}
			}

			// If any pods are unavailable report it and sleep until the next loop
			// Else everything is available and the loop will exit
			if len(unavailableWorkloadResources) > 0 {
				utils.LogInfo(fmt.Sprintf("Wait for %d workload resources:", len(unavailableWorkloadResources)))
				for _, unavailableWorkloadResource := range unavailableWorkloadResources {
					utils.LogInfo(fmt.Sprintf("    - %s %s with %d unavailable pods", unavailableWorkloadResource.ResourceType, unavailableWorkloadResource.Name, unavailableWorkloadResource.Unavailable))
				}
				time.Sleep(time.Second)
			} else {
				utils.LogInfo(fmt.Sprintf("Finish wait for workload resources, --timeout time left %s", time.Until(deadline).String()))
			}
		} else {
			resourceType := "Deployment"
			errMsg := errDeployments
			if errDaemonSets != nil {
				resourceType = "DaemonSet"
				errMsg = errDaemonSets
			} else if errStatefulSets != nil {
				resourceType = "StatefulSet"
				errMsg = errStatefulSets
			}
			unavailableWorkloadResources = []workloadNotReady{{Name: "none", ResourceType: resourceType, Unavailable: 1}}
			getWorkloadResourceError = fmt.Sprintf("error getting %s from namespace %s : %v", resourceType, namespace, errMsg)
			utils.LogWarning(getWorkloadResourceError)
			time.Sleep(time.Second)
		}
	}

	// Any errors or resources that are still unavailable returns an error at this point
	if getWorkloadResourceError != "" {
		errorMsg := fmt.Sprintf("Time out retrying after %s", getWorkloadResourceError)
		utils.LogError(errorMsg)
		return errors.New(errorMsg)
	}
	if len(unavailableWorkloadResources) > 0 {
		errorMsg := "error unavailable workload resources, timeout has expired, please consider increasing the timeout using the chart-verifier --timeout flag"
		utils.LogError(errorMsg)
		return errors.New(errorMsg)
	}

	return nil
}

func (k Kubectl) DeleteNamespace(context context.Context, namespace string) error {
	if err := k.clientset.CoreV1().Namespaces().Delete(context, namespace, *metav1.NewDeleteOptions(0)); err != nil {
		return err
	}
	return nil
}

func (k Kubectl) GetServerVersion() (*version.Info, error) {
	version, err := k.clientset.Discovery().ServerVersion()
	if err != nil {
		return nil, err
	}
	return version, err
}

func GetKubeOpenShiftVersionMap() map[string]string {
	return kubeOpenShiftVersionMap
}

func GetClientConfig(envSettings *cli.EnvSettings) clientcmd.ClientConfig {
	loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
	if len(envSettings.KubeConfig) > 0 {
		loadingRules = &clientcmd.ClientConfigLoadingRules{ExplicitPath: envSettings.KubeConfig}
	}

	return clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
		loadingRules,
		&clientcmd.ConfigOverrides{CurrentContext: envSettings.KubeContext})
}

func getDeploymentsList(k Kubectl, context context.Context, namespace string, selector string) ([]v1.Deployment, error) {
	list, err := k.clientset.AppsV1().Deployments(namespace).List(context, metav1.ListOptions{LabelSelector: selector})
	if err != nil {
		return nil, err
	}
	return list.Items, err
}

func getStatefulSetsList(k Kubectl, context context.Context, namespace string, selector string) ([]v1.StatefulSet, error) {
	list, err := k.clientset.AppsV1().StatefulSets(namespace).List(context, metav1.ListOptions{LabelSelector: selector})
	if err != nil {
		return nil, err
	}
	return list.Items, err
}

func getDaemonSetsList(k Kubectl, context context.Context, namespace string, selector string) ([]v1.DaemonSet, error) {
	list, err := k.clientset.AppsV1().DaemonSets(namespace).List(context, metav1.ListOptions{LabelSelector: selector})
	if err != nil {
		return nil, err
	}
	return list.Items, err
}

func GetLatestKubeVersion() string {
	return latestKubeVersion.String()
}

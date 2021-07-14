package actions

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/kube"
	"helm.sh/helm/v3/pkg/release"
	"helm.sh/helm/v3/pkg/storage"
	"helm.sh/helm/v3/pkg/storage/driver"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

func TestResourceQuotaRace(t *testing.T) {
	if os.Getenv("OPENSHIFT_CI") != "" {
		// Only allow manual testing
		t.Skip("Skipping resourcequota stress testing")
	}

	tests := []struct {
		releaseName  string
		chartPath    string
		chartName    string
		chartVersion string
		values       map[string]interface{}
		iterations   int
	}{
		{
			releaseName:  "repeated chart installation",
			chartPath:    "../testdata/gitlab-4.12.3.tgz",
			chartName:    "gitlab",
			chartVersion: "4.12.3",
			values: map[string]interface{}{
				"certmanager-issuer": map[string]interface{}{
					"email": "email@example.com",
				},
			},
			// NOTE: Time estimation per iteration: 2.5 mins
			iterations: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.releaseName, func(t *testing.T) {
			// Connect to client
			kubeconfig, ok := os.LookupEnv("KUBECONFIG")
			if !ok {
				kubeconfig = filepath.Join(
					os.Getenv("HOME"), ".kube", "config",
				)
			}

			config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
			if err != nil {
				t.Errorf("Error occurred while creating config: %v", err)
			}

			clientset, err := kubernetes.NewForConfig(config)
			if err != nil {
				t.Errorf("Error occurred while creating Clientset: %v", err)
			}

			// Create 'resource-stress-test' namespace for testing
			_, err = clientset.CoreV1().Namespaces().Get(context.TODO(), "resource-stress-test", metav1.GetOptions{})
			if err != nil {
				t.Log("Creating project 'resource-stress-test'")

				project := &v1.Namespace{
					ObjectMeta: metav1.ObjectMeta{
						Name: "resource-stress-test",
					},
				}
				_, err = clientset.CoreV1().Namespaces().Create(context.TODO(), project, metav1.CreateOptions{})
				if err != nil {
					t.Errorf("Error occurred while creating namespace: %v", err)
				}
			}

			t.Log("Switching to 'resource-stress-test' project")
			cmd := exec.Command("oc", "project", "resource-stress-test")
			err = cmd.Run()
			if err != nil {
				t.Errorf("Error occurred while creating project: %v", err)
			}

			t.Log("Creating resource quota")
			cmd = exec.Command("oc", "apply", "-f", "../testdata/test-quota.yaml")
			err = cmd.Run()
			if err != nil {
				t.Errorf("Error occurred while creating resource quota: %v", err)
			}

			t.Log("Creating cpu limit range")
			cmd = exec.Command("oc", "apply", "-f", "../testdata/test-cpu-limit.yaml")
			err = cmd.Run()
			if err != nil {
				t.Errorf("Error occurred while creating cpu limit range: %v", err)
			}

			store := storage.Init(driver.NewMemory())
			kubeClient := kube.New(genericclioptions.NewConfigFlags(true))
			kubeClient.Namespace = "resource-stress-test"
			actionConfig := &action.Configuration{
				Releases:     store,
				KubeClient:   kubeClient,
				Capabilities: chartutil.DefaultCapabilities,
				Log:          func(format string, v ...interface{}) {},
			}
			for i := 0; i < tt.iterations; i++ {

				// Grant SCC to the test service account
				t.Logf("Granting SCC to %v service account", fmt.Sprintf("test-%d-shared-secrets", i))
				cmd = exec.Command("oc", "adm", "policy", "add-scc-to-user", "privileged", "-z", fmt.Sprintf("test-%d-shared-secrets", i))
				err = cmd.Run()
				if err != nil {
					t.Errorf("Error occurred while granting SCC to service account: %v", err)
				}

				rel, err := InstallChart("resource-stress-test", fmt.Sprintf("test-%d", i), tt.chartPath, tt.values, actionConfig)
				if err != nil {
					t.Errorf("Error occurred while installing chartPath: %v", err)
				}
				if rel.Name != fmt.Sprintf("test-%d", i) {
					t.Error("Release name isn't matching")
				}
				if rel.Namespace != "resource-stress-test" {
					t.Error("Namespace isn't matching")
				}
				if rel.Info.Status != release.StatusDeployed {
					t.Error("Chart status should be deployed")
				}
				if rel.Chart.Metadata.Name != tt.chartName {
					t.Error("Chart name mismatch")
				}
				if rel.Chart.Metadata.Version != tt.chartVersion {
					t.Error("Chart version mismatch")
				}

				resp, err := UninstallRelease(rel.Name, actionConfig)
				if err != nil {
					t.Errorf("Error occurred while uninstalling chartPath: %v", err)
				}
				if resp != nil && resp.Release.Info.Status != release.StatusUninstalled {
					t.Error("Release status is not uninstalled")
				}
			}
		})
	}

	// Cleaning up 'resource-stress-test' namespace
	t.Cleanup(func() {
		t.Log("Deleting project 'resource-stress-test'")

		// Connect to client
		kubeconfig := filepath.Join(
			os.Getenv("HOME"), ".kube", "config",
		)
		config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			t.Errorf("Error occurred while creating config: %v", err)
		}

		clientset, err := kubernetes.NewForConfig(config)
		if err != nil {
			t.Errorf("Error occurred while creating Clientset: %v", err)
		}

		err = clientset.CoreV1().Namespaces().Delete(context.TODO(), "resource-stress-test", metav1.DeleteOptions{})
		if err != nil {
			t.Errorf("Error occurred while deleting project: %v", err)
		}
	})
}

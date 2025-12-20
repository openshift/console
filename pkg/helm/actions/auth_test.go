package actions

import (
	"io/ioutil"
	"testing"

	configv1 "github.com/openshift/api/config/v1"
	"github.com/openshift/api/helm/v1beta1"
	"github.com/stretchr/testify/require"
	"helm.sh/helm/v3/pkg/action"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	k8sfake "k8s.io/client-go/kubernetes/fake"
)

func TestAuthenticationDoesNotSetRepoURL(t *testing.T) {
	tests := []struct {
		name           string
		config         *v1beta1.ConnectionConfig
		hasCA          bool
		hasTLS         bool
		expectCaFile   bool
		expectCertFile bool
	}{
		{
			name: "CA certificate only",
			config: &v1beta1.ConnectionConfig{
				URL: "https://charts.example.com",
				CA:  configv1.ConfigMapNameReference{Name: "test-ca"},
			},
			hasCA:        true,
			expectCaFile: true,
		},
		{
			name: "Client TLS only",
			config: &v1beta1.ConnectionConfig{
				URL:             "https://charts.example.com",
				TLSClientConfig: configv1.SecretNameReference{Name: "test-tls"},
			},
			hasTLS:         true,
			expectCertFile: true,
		},
		{
			name: "Both CA and client TLS",
			config: &v1beta1.ConnectionConfig{
				URL:             "https://charts.example.com",
				CA:              configv1.ConfigMapNameReference{Name: "test-ca"},
				TLSClientConfig: configv1.SecretNameReference{Name: "test-tls"},
			},
			hasCA:          true,
			hasTLS:         true,
			expectCaFile:   true,
			expectCertFile: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			opts := &action.ChartPathOptions{}
			objs := []runtime.Object{}

			if tt.hasCA {
				caConfigMap := &v1.ConfigMap{
					Data:       map[string]string{caBundleKey: "FAKE_CA_DATA"},
					ObjectMeta: metav1.ObjectMeta{Name: "test-ca", Namespace: configNamespace},
				}
				objs = append(objs, caConfigMap)
			}

			if tt.hasTLS {
				cert, _ := ioutil.ReadFile("./server.crt")
				key, _ := ioutil.ReadFile("./server.key")
				tlsSecret := &v1.Secret{
					Data: map[string][]byte{
						tlsSecretCertKey: cert,
						tlsSecretKey:     key,
					},
					ObjectMeta: metav1.ObjectMeta{Name: "test-tls", Namespace: configNamespace},
				}
				objs = append(objs, tlsSecret)
			}

			coreClient := k8sfake.NewSimpleClientset(objs...).CoreV1()

			tlsFiles, err := setUpAuthentication(opts, tt.config, coreClient)
			require.NoError(t, err)

			require.Empty(t, opts.RepoURL)

			// Verify auth fields are set
			if tt.expectCaFile {
				require.NotEmpty(t, opts.CaFile)
			}
			if tt.expectCertFile {
				require.NotEmpty(t, opts.CertFile)
				require.NotEmpty(t, opts.KeyFile)
			}

			expectedFileCount := 0
			if tt.hasCA {
				expectedFileCount++
			}
			if tt.hasTLS {
				expectedFileCount += 2
			}
			require.Len(t, tlsFiles, expectedFileCount)

			// Cleanup
			for _, f := range tlsFiles {
				f.Close()
			}
		})
	}
}

func TestAuthenticationProjectDoesNotSetRepoURL(t *testing.T) {
	opts := &action.ChartPathOptions{}
	config := &v1beta1.ConnectionConfigNamespaceScoped{
		URL: "https://charts.example.com",
		CA:  configv1.ConfigMapNameReference{Name: "test-ca"},
	}

	caConfigMap := &v1.ConfigMap{
		Data:       map[string]string{caBundleKey: "FAKE_CA_DATA"},
		ObjectMeta: metav1.ObjectMeta{Name: "test-ca", Namespace: "test-ns"},
	}

	coreClient := k8sfake.NewSimpleClientset(caConfigMap).CoreV1()

	tlsFiles, err := setUpAuthenticationProject(opts, config, coreClient, "test-ns")
	require.NoError(t, err)

	require.Empty(t, opts.RepoURL)
	require.NotEmpty(t, opts.CaFile)

	// Cleanup
	for _, f := range tlsFiles {
		f.Close()
	}
}

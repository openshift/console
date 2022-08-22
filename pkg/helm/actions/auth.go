package actions

import (
	"context"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
	"time"

	configv1 "github.com/openshift/api/config/v1"
	"github.com/openshift/api/helm/v1beta1"
	"helm.sh/helm/v3/pkg/action"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	corev1client "k8s.io/client-go/kubernetes/typed/core/v1"
)

func setUpAuthentication(chartPathOptions *action.ChartPathOptions, connectionConfig *v1beta1.ConnectionConfig, coreClient corev1client.CoreV1Interface) ([]*os.File, error) {
	tlsFiles := []*os.File{}
	//set up tls cert and key
	if connectionConfig.TLSClientConfig != (configv1.SecretNameReference{}) {
		chartPathOptions.RepoURL = connectionConfig.URL
		tlsKeyFile, tlsCertFile, err := setupTlsCertFile(connectionConfig.TLSClientConfig.Name, configNamespace, coreClient)
		if err != nil {
			return nil, err
		}
		chartPathOptions.CertFile = tlsCertFile.Name()
		tlsFiles = append(tlsFiles, tlsCertFile)
		chartPathOptions.KeyFile = tlsKeyFile.Name()
		tlsFiles = append(tlsFiles, tlsKeyFile)
	}
	//set up ca certificate
	if connectionConfig.CA != (configv1.ConfigMapNameReference{}) {
		chartPathOptions.RepoURL = connectionConfig.URL
		caFile, err := setupCaCertFile(connectionConfig.CA.Name, configNamespace, coreClient)
		if err != nil {
			return nil, err
		}
		chartPathOptions.CaFile = caFile.Name()
		tlsFiles = append(tlsFiles, caFile)
	}
	return tlsFiles, nil
}

func setUpAuthenticationProject(chartPathOptions *action.ChartPathOptions, connectionConfig *v1beta1.ConnectionConfigNamespaceScoped, coreClient corev1client.CoreV1Interface, namespace string) ([]*os.File, error) {
	tlsFiles := []*os.File{}
	var secretNamespace string
	//set up tls cert and key
	if connectionConfig.TLSClientConfig != (configv1.SecretNameReference{}) {
		chartPathOptions.RepoURL = connectionConfig.URL
		tlsKeyFile, tlsCertFile, err := setupTlsCertFile(connectionConfig.TLSClientConfig.Name, namespace, coreClient)
		if err != nil {
			return nil, err
		}
		chartPathOptions.CertFile = tlsCertFile.Name()
		tlsFiles = append(tlsFiles, tlsCertFile)
		chartPathOptions.KeyFile = tlsKeyFile.Name()
		tlsFiles = append(tlsFiles, tlsKeyFile)
	}
	//set up basic auth
	if connectionConfig.BasicAuthConfig != (configv1.SecretNameReference{}) {
		secretName := connectionConfig.BasicAuthConfig.Name
		secret, err := coreClient.Secrets(namespace).Get(context.TODO(), secretName, v1.GetOptions{})
		if err != nil {
			return nil, fmt.Errorf("failed to GET secret '%s/%s', reason %v", secretNamespace, secretName, err)
		}
		baUsername, found := secret.Data[username]
		if !found {
			return nil, fmt.Errorf("failed to find %q key in secret '%s/%s'", username, secretNamespace, secretName)
		}
		chartPathOptions.Username = string(baUsername)
		baPassword, found := secret.Data[password]
		if !found {
			return nil, fmt.Errorf("failed to find %q key in secret '%s/%s'", password, secretNamespace, secretName)
		}
		chartPathOptions.Password = string(baPassword)
	}
	//set up ca certificate
	if connectionConfig.CA != (configv1.ConfigMapNameReference{}) {
		chartPathOptions.RepoURL = connectionConfig.URL
		caFile, err := setupCaCertFile(connectionConfig.CA.Name, namespace, coreClient)
		if err != nil {
			return nil, err
		}
		chartPathOptions.CaFile = caFile.Name()
		tlsFiles = append(tlsFiles, caFile)
	}
	return tlsFiles, nil
}

func setupTlsCertFile(secretName string, namespace string, coreClient corev1client.CoreV1Interface) (*os.File, *os.File, error) {
	//set up tls cert and key
	secret, err := coreClient.Secrets(namespace).Get(context.TODO(), secretName, v1.GetOptions{})
	if err != nil {
		return nil, nil, fmt.Errorf("Failed to GET secret %q from %v reason %v", secretName, namespace, err)
	}
	tlsCertBytes, found := secret.Data[tlsSecretCertKey]
	if !found {
		return nil, nil, fmt.Errorf("Failed to find %q key in secret %q", tlsSecretCertKey, secretName)
	}
	certificateVerifyErr := certificateVerifier(tlsCertBytes)
	if certificateVerifyErr != nil {
		return nil, nil, fmt.Errorf("failed to verify custom certificate PEM: " + certificateVerifyErr.Error())
	}
	tlsCertFile, err := writeTempFile((tlsCertBytes), tlsSecretPattern)
	if err != nil {
		return nil, nil, err
	}
	tlsKeyBytes, found := secret.Data[tlsSecretKey]
	if !found {
		return nil, nil, fmt.Errorf("Failed to find %q key in secret %q", tlsSecretKey, secretName)
	}
	privateKeyVerifyErr := privateKeyVerifier(tlsKeyBytes)
	if privateKeyVerifyErr != nil {
		return nil, nil, fmt.Errorf("failed to verify custom key PEM: " + privateKeyVerifyErr.Error())
	}
	tlsKeyFile, err := writeTempFile(tlsKeyBytes, tlsKeyPattern)
	if err != nil {
		return nil, nil, err
	}
	return tlsKeyFile, tlsCertFile, nil
}

func certificateVerifier(customCert []byte) error {
	block, _ := pem.Decode([]byte(customCert))
	if block == nil {
		return fmt.Errorf("failed to decode certificate PEM")
	}
	certificate, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return err
	}
	now := time.Now()
	if now.After(certificate.NotAfter) {
		return fmt.Errorf("custom TLS certificate is expired")
	}
	if now.Before(certificate.NotBefore) {
		return fmt.Errorf("custom TLS certificate is not valid yet")
	}
	return nil
}

func privateKeyVerifier(customKey []byte) error {
	block, _ := pem.Decode([]byte(customKey))
	if block == nil {
		return fmt.Errorf("failed to decode key PEM")
	}
	if _, err := x509.ParsePKCS8PrivateKey(block.Bytes); err != nil {
		if _, err = x509.ParsePKCS1PrivateKey(block.Bytes); err != nil {
			if _, err = x509.ParseECPrivateKey(block.Bytes); err != nil {
				return fmt.Errorf("block %s is not valid key PEM", block.Type)
			}
		}
	}
	return nil
}

func setupCaCertFile(cacert string, namespace string, coreClient corev1client.CoreV1Interface) (*os.File, error) {
	configMap, err := coreClient.ConfigMaps(namespace).Get(context.TODO(), cacert, v1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("Failed to GET configmap %q, reason %v", cacert, err)
	}
	caCertBytes, found := configMap.Data[caBundleKey]
	if !found {
		return nil, fmt.Errorf("Failed to find %q key in configmap %q", caBundleKey, cacert)
	}
	caCertFile, caCertGetErr := writeTempFile([]byte(caCertBytes), cacertPattern)
	if caCertGetErr != nil {
		return nil, caCertGetErr
	}
	return caCertFile, nil
}

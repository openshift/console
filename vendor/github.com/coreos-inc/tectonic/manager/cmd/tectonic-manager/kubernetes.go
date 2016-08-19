package main

import (
	"fmt"

	apierrors "k8s.io/kubernetes/pkg/api/errors"
	"k8s.io/kubernetes/pkg/api/v1"
	"k8s.io/kubernetes/pkg/api/validation"
	"k8s.io/kubernetes/pkg/apis/extensions/v1beta1"
	clientset "k8s.io/kubernetes/pkg/client/clientset_generated/release_1_3"
	"k8s.io/kubernetes/pkg/client/unversioned/clientcmd"
	cmdutil "k8s.io/kubernetes/pkg/kubectl/cmd/util"
	"k8s.io/kubernetes/pkg/kubectl/resource"
)

var statefulLabel = map[string]string{"stateful": "true"}

func newKubeClientSet() (*clientset.Clientset, error) {
	restclientCfg, err := kconfig.ClientConfig()
	if err != nil {
		return nil, err
	}
	return clientset.NewForConfig(restclientCfg)
}

func newKubeCmdFactorySchema() (*cmdutil.Factory, validation.Schema, error) {
	f := cmdutil.NewFactory(kconfig)
	schema, err := f.Validator(true, fmt.Sprintf("~/%s/%s", clientcmd.RecommendedHomeDir, clientcmd.RecommendedSchemaName))
	if err != nil {
		return nil, nil, fmt.Errorf("unable to build schema for Kubernetes client %v", err)
	}
	return f, schema, nil
}

// newKubectlResultFromFile takes a filePath and constructs a resource.Result
// object which contains resource.Info objects. These Info objects contain
// methods for retrieving, creating, or updating resources in Kubernetes
// that they refer to. These objects are not yet populated with any info from
// the API, you must explicitly use the visitor pattern or access infos
// directly if you wish to interact with the API.
func newKubectlResultFromFile(f *cmdutil.Factory, schema validation.Schema, filePath string) (*resource.Result, error) {
	cmdNamespace, enforceNamespace, err := f.DefaultNamespace()
	if err != nil {
		return nil, err
	}

	includeExtendedAPIs := false
	mapper, typer := f.Object(includeExtendedAPIs)
	recursive := false
	r := resource.NewBuilder(mapper, typer, resource.ClientMapperFunc(f.ClientForMapping), f.Decoder(true)).
		Schema(schema).
		NamespaceParam(cmdNamespace).DefaultNamespace().
		FilenameParam(enforceNamespace, recursive, filePath).
		Flatten().
		Do()
	err = r.Err()
	if err != nil {
		return nil, fmt.Errorf("unable to create resources from %s: %v", filePath, err)
	}
	return r, nil
}

func kubectlGetInfosFromFile(f *cmdutil.Factory, schema validation.Schema, filePath string) ([]*resource.Info, error) {
	r, err := newKubectlResultFromFile(f, schema, filePath)
	if err != nil {
		return nil, err
	}
	return r.Infos()
}

func kubectlCreateFromFile(f *cmdutil.Factory, schema validation.Schema, filePath string) error {
	r, err := newKubectlResultFromFile(f, schema, filePath)
	if err != nil {
		return err
	}

	count := 0
	err = r.Visit(func(info *resource.Info, err error) error {
		if err != nil {
			return err
		}

		obj, err := resource.NewHelper(info.Client, info.Mapping).Create(info.Namespace, true, info.Object)
		if err != nil {
			return cmdutil.AddSourceToErr("creating", info.Source, err)
		}
		info.Refresh(obj, true)

		count++
		logger.Printf("%s %s created", info.Mapping.Resource, info.Name)
		return nil
	})
	if err != nil {
		return err
	}
	if count == 0 {
		return fmt.Errorf("no objects passed to create")
	}
	return nil
}

func createSecret(name string, data map[string][]byte, labels map[string]string) error {
	kclient, err := newKubeClientSet()
	if err != nil {
		return err
	}
	namespace, _, err := kconfig.Namespace()
	if err != nil {
		return err
	}

	secret := &v1.Secret{
		ObjectMeta: v1.ObjectMeta{
			Name:   name,
			Labels: labels,
		},
		Data: data,
		Type: v1.SecretTypeOpaque,
	}

	_, err = kclient.Core().Secrets(namespace).Create(secret)
	if err != nil {
		return err
	}
	return nil
}

func getDeployment(name string) (*v1beta1.Deployment, error) {
	kclient, err := newKubeClientSet()
	if err != nil {
		return nil, err
	}
	namespace, _, err := kconfig.Namespace()
	if err != nil {
		return nil, err
	}
	return kclient.Extensions().Deployments(namespace).Get(name)
}

func checkSecretExists(name string) (bool, error) {
	_, err := getSecret(name)
	if err != nil {
		if apierrors.IsNotFound(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func getSecret(name string) (*v1.Secret, error) {
	kclient, err := newKubeClientSet()
	if err != nil {
		return nil, err
	}
	namespace, _, err := kconfig.Namespace()
	if err != nil {
		return nil, err
	}
	return kclient.Core().Secrets(namespace).Get(name)
}

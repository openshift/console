module github.com/openshift/console

go 1.16

require (
	github.com/coreos/go-oidc v2.1.0+incompatible
	github.com/coreos/pkg v0.0.0-20180928190104-399ea9e2e55f
	github.com/devfile/api/v2 v2.0.0-20210910153124-da620cd1a7a1
	github.com/devfile/library v1.1.1-0.20210910214722-7c5ff63711ec
	github.com/devfile/registry-support/index/generator v0.0.0-20211012185733-0a73f866043f
	github.com/devfile/registry-support/registry-library v0.0.0-20211026200306-cab748834109
	github.com/ghodss/yaml v1.0.1-0.20190212211648-25d852aebe32 // indirect
	github.com/gorilla/websocket v1.4.2
	github.com/graph-gophers/graphql-go v0.0.0-20200309224638-dae41bde9ef9
	github.com/openshift/api v0.0.0-20210105115604-44119421ec6b
	github.com/openshift/library-go v0.0.0-20200424095618-2aeb4725dadf
	github.com/operator-framework/kubectl-operator v0.3.0
	github.com/pquerna/cachecontrol v0.0.0-20180517163645-1555304b9b35 // indirect
	github.com/prometheus/client_golang v1.11.0
	github.com/rawagner/graphql-transport-ws v0.0.0-20200817140314-dcfbf0388067
	golang.org/x/net v0.0.0-20210428140749-89ef3d95e781
	golang.org/x/oauth2 v0.0.0-20200107190931-bf48bf16ab8d
	gopkg.in/square/go-jose.v2 v2.4.1 // indirect
	gopkg.in/yaml.v2 v2.4.0
	helm.sh/helm/v3 v3.6.2
	k8s.io/api v0.21.3
	k8s.io/apiextensions-apiserver v0.21.3
	k8s.io/apimachinery v0.21.3
	k8s.io/cli-runtime v0.21.0
	k8s.io/client-go v0.21.3
	k8s.io/klog v1.0.0
	k8s.io/klog/v2 v2.8.0
	sigs.k8s.io/controller-runtime v0.9.5
	sigs.k8s.io/yaml v1.2.0
)

replace (
	github.com/Azure/go-autorest/autorest => github.com/Azure/go-autorest/autorest v0.9.0
	github.com/docker/docker => github.com/moby/moby v0.7.3-0.20190826074503-38ab9da00309
	github.com/irifrance/gini v1.0.1 => github.com/go-air/gini v1.0.1
	github.com/mikefarah/yq/v2 v2.4.1 => github.com/mikefarah/yq/v4 v4.13.2
	github.com/opencontainers/runc => github.com/opencontainers/runc v1.0.0-rc8.0.20190926150303-84373aaa560b
)

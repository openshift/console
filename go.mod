module github.com/openshift/console

go 1.12

require (
	github.com/coreos/dex v2.3.0+incompatible
	github.com/coreos/go-oidc v2.1.0+incompatible
	github.com/coreos/pkg v0.0.0-20180928190104-399ea9e2e55f
	github.com/gorilla/websocket v1.4.0
	github.com/openshift/library-go v0.0.0-20190731063920-9fac0f4cee90
	golang.org/x/oauth2 v0.0.0-20191202225959-858c2ad4c8b6
	google.golang.org/grpc v1.27.0
	gopkg.in/yaml.v2 v2.2.8
	k8s.io/apiserver v0.19.3 // indirect
	k8s.io/client-go v11.0.0+incompatible // indirect
	k8s.io/klog v1.0.0 // indirect
)

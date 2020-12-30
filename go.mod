module github.com/openshift/console

go 1.13

require (
	github.com/cenk/backoff v2.2.1+incompatible // indirect
	github.com/containous/traefik v1.7.26 // indirect
	github.com/coreos/dex v2.3.0+incompatible
	github.com/coreos/go-oidc v2.1.0+incompatible
	github.com/coreos/pkg v0.0.0-20180928190104-399ea9e2e55f
	github.com/eapache/channels v1.1.0
	github.com/fsnotify/fsnotify v1.4.9
	github.com/gorilla/mux v1.8.0
	github.com/gorilla/websocket v1.4.2
	github.com/gravitational/trace v1.1.11 // indirect
	github.com/kr/pretty v0.2.0 // indirect
	github.com/pkg/errors v0.9.1
	github.com/pquerna/cachecontrol v0.0.0-20180517163645-1555304b9b35 // indirect
	github.com/sirupsen/logrus v1.7.0
	github.com/spf13/viper v1.7.1
	github.com/stretchr/testify v1.6.1
	github.com/traefik/traefik v1.7.26
	github.com/traefik/traefik/v2 v2.3.6
	github.com/vulcand/predicate v1.1.0
	golang.org/x/net v0.0.0-20201021035429-f5854403a974 // indirect
	golang.org/x/oauth2 v0.0.0-20200107190931-bf48bf16ab8d
	golang.org/x/sync v0.0.0-20201020160332-67f06af15bc9 // indirect
	golang.org/x/xerrors v0.0.0-20200804184101-5ec99f83aff1 // indirect
	google.golang.org/grpc v1.27.1
	gopkg.in/yaml.v2 v2.3.0
	gotest.tools v2.2.0+incompatible
	helm.sh/helm/v3 v3.2.1
	k8s.io/api v0.18.2
	k8s.io/apiextensions-apiserver v0.18.0
	k8s.io/apimachinery v0.18.2
	k8s.io/cli-runtime v0.18.0
	k8s.io/client-go v0.18.2
	k8s.io/klog v1.0.0
	rsc.io/letsencrypt v0.0.3 // indirect
	sigs.k8s.io/yaml v1.2.0

)

// Containous forks

replace (
	github.com/Azure/go-autorest/autorest => github.com/Azure/go-autorest/autorest v0.9.0

	github.com/abbot/go-http-auth => github.com/containous/go-http-auth v0.4.1-0.20200324110947-a37a7636d23e
	github.com/docker/docker => github.com/moby/moby v0.7.3-0.20190826074503-38ab9da00309
	github.com/go-check/check => github.com/containous/check v0.0.0-20170915194414-ca0bf163426a
)

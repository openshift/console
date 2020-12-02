module github.com/openshift/console

go 1.13

require (
	github.com/Masterminds/semver v1.5.0 // indirect
	github.com/Masterminds/sprig v2.22.0+incompatible // indirect
	github.com/VividCortex/gohistogram v1.0.0 // indirect
	github.com/abronan/valkeyrie v0.1.0 // indirect
	github.com/cenk/backoff v2.2.1+incompatible // indirect
	github.com/codegangsta/negroni v1.0.0
	github.com/containous/flaeg v1.4.1 // indirect
	github.com/containous/mux v0.0.0-20200408164629-f779179d490a // indirect
	github.com/containous/traefik v1.7.26 // indirect
	github.com/coreos/dex v2.3.0+incompatible
	github.com/coreos/go-oidc v2.1.0+incompatible
	github.com/coreos/pkg v0.0.0-20180928190104-399ea9e2e55f
	github.com/gorilla/context v1.1.1 // indirect
	github.com/gorilla/mux v1.8.0
	github.com/gorilla/websocket v1.4.0
	github.com/gravitational/trace v1.1.11 // indirect
	github.com/mitchellh/hashstructure v1.1.0 // indirect
	github.com/ogier/pflag v0.0.1 // indirect
	github.com/patrickmn/go-cache v2.1.0+incompatible // indirect
	github.com/pkg/errors v0.9.1
	github.com/pquerna/cachecontrol v0.0.0-20180517163645-1555304b9b35 // indirect
	github.com/ryanuber/go-glob v1.0.0 // indirect
	github.com/sirupsen/logrus v1.4.2
	github.com/stretchr/testify v1.5.1
	github.com/traefik/traefik v1.7.26
	github.com/vulcand/predicate v1.1.0
	golang.org/x/oauth2 v0.0.0-20190604053449-0f29369cfe45
	google.golang.org/grpc v1.27.0
	gopkg.in/square/go-jose.v2 v2.4.1 // indirect
	gopkg.in/yaml.v2 v2.2.8
	gotest.tools v2.2.0+incompatible
	helm.sh/helm/v3 v3.2.1
	k8s.io/api v0.18.0
	k8s.io/apiextensions-apiserver v0.18.0
	k8s.io/apimachinery v0.18.0
	k8s.io/cli-runtime v0.18.0
	k8s.io/client-go v0.18.0
	k8s.io/klog v1.0.0
	rsc.io/letsencrypt v0.0.3 // indirect
)

replace (
	github.com/Azure/go-autorest/autorest => github.com/Azure/go-autorest/autorest v0.9.0
	github.com/docker/docker => github.com/moby/moby v0.7.3-0.20190826074503-38ab9da00309
)

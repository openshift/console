package server

import (
	"github.com/coreos-inc/tectonic/bootstrap/binassets"
	"github.com/coreos-inc/tectonic/bootstrap/server/asset"
)

var (
	// Tectonic add-on Kubernetes manifests
	tectonicDefault = tectonicDefaults{
		tectonicNamespace:      binassets.MustAsset("tectonic-namespace.yaml"),
		tectonicManager:        binassets.MustAsset("tectonic-manager-deployment.yaml"),
		tectonicManagerService: binassets.MustAsset("tectonic-manager-service.yaml"),
		heapsterDeployment:     binassets.MustAsset("heapster-deployment.json"),
		heapsterService:        binassets.MustAsset("heapster-svc.json"),
	}
)

// Tectonic default manifests
type tectonicDefaults struct {
	tectonicNamespace      []byte
	tectonicManager        []byte
	tectonicManagerService []byte
	heapsterDeployment     []byte
	heapsterService        []byte
}

// newTectonicAssets returns Kubernetes manifest assets for Tectonic clusters.
func newTectonicAssets() []asset.Asset {
	return []asset.Asset{
		asset.New("manifests/tectonic-namespace.yaml", tectonicDefault.tectonicNamespace),
		asset.New("manifests/tectonic-manager-deployment.yaml", tectonicDefault.tectonicManager),
		asset.New("manifests/tectonic-manager-service.yaml", tectonicDefault.tectonicManagerService),
		asset.New("manifests/heapster-deployment.json", tectonicDefault.heapsterDeployment),
		asset.New("manifests/heapster-svc.json", tectonicDefault.heapsterService),
	}
}

package server

import (
	"fmt"

	bootkube "github.com/coreos/bootkube/pkg/asset"
	"github.com/go-yaml/yaml"

	"github.com/coreos-inc/tectonic/bootstrap/server/asset"
)

// kubeConfig represents kubeconfig credentials.
type kubeConfig struct {
	certificateAuthority string
	clientCertificate    string
	clientKey            string
}

func parseKubeConfig(assets []asset.Asset) (*kubeConfig, error) {
	var capture struct {
		Clusters []struct {
			Cluster struct {
				CertificateAuthority string `yaml:"certificate-authority-data"`
			} `yaml:"cluster"`
		} `yaml:"clusters"`
		Users []struct {
			User struct {
				ClientCertificate string `yaml:"client-certificate-data"`
				ClientKey         string `yaml:"client-key-data"`
			} `yaml:"user"`
		} `yaml:"users"`
	}

	var a asset.Asset
	var err error
	if a, err = asset.Find(assets, bootkube.AssetPathKubeConfig); err == nil {
		if err = yaml.Unmarshal(a.Data(), &capture); err == nil {
			if len(capture.Clusters) > 0 && len(capture.Users) > 0 {
				cluster := capture.Clusters[0].Cluster
				user := capture.Users[0].User
				return &kubeConfig{
					certificateAuthority: cluster.CertificateAuthority,
					clientCertificate:    user.ClientCertificate,
					clientKey:            user.ClientKey,
				}, nil
			}
			return nil, fmt.Errorf("installer: invalid bootkube kubeconfig")
		}
	}
	return nil, err
}

package olmv1

import (
	"github.com/operator-framework/operator-registry/alpha/model"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

const (
	ClusterCatalogGroup   = "olm.operatorframework.io"
	ClusterCatalogVersion = "v1"
	ClusterCatalogKind    = "ClusterCatalog"
)

var (
	ClusterCatalogGVR = schema.GroupVersionResource{
		Group:    ClusterCatalogGroup,
		Version:  ClusterCatalogVersion,
		Resource: "clustercatalogs",
	}
)

// ClusterCatalogStatus represents the status of a ClusterCatalog
type ClusterCatalogStatus struct {
	BaseURL string `json:"baseURL,omitempty"`
}

// CatalogIndex represents the processed FBC data from a ClusterCatalog
// It wraps the official model.Model type from operator-registry
type CatalogIndex struct {
	CatalogName string      `json:"catalogName"`
	BaseURL     string      `json:"baseURL"`
	Model       model.Model `json:"model"`
	LastUpdated string      `json:"lastUpdated"`
	ObjectCount int         `json:"objectCount"`
}

// GetPackages returns all packages in the catalog index
func (ci *CatalogIndex) GetPackages() []*model.Package {
	packages := make([]*model.Package, 0, len(ci.Model))
	for _, pkg := range ci.Model {
		packages = append(packages, pkg)
	}
	return packages
}

// GetPackage returns a specific package by name
func (ci *CatalogIndex) GetPackage(name string) *model.Package {
	return ci.Model[name]
}

// GetChannels returns all channels for a given package
func (ci *CatalogIndex) GetChannels(packageName string) []*model.Channel {
	pkg := ci.GetPackage(packageName)
	if pkg == nil {
		return nil
	}

	channels := make([]*model.Channel, 0, len(pkg.Channels))
	for _, ch := range pkg.Channels {
		channels = append(channels, ch)
	}
	return channels
}

// GetBundles returns all bundles for a given package and channel
func (ci *CatalogIndex) GetBundles(packageName, channelName string) []*model.Bundle {
	pkg := ci.GetPackage(packageName)
	if pkg == nil {
		return nil
	}

	channel := pkg.Channels[channelName]
	if channel == nil {
		return nil
	}

	bundles := make([]*model.Bundle, 0, len(channel.Bundles))
	for _, bundle := range channel.Bundles {
		bundles = append(bundles, bundle)
	}
	return bundles
}

// SearchFilter represents query parameters for searching catalog content
type SearchFilter struct {
	PackageName string `json:"packageName,omitempty"`
	Channel     string `json:"channel,omitempty"`
	Keywords    string `json:"keywords,omitempty"`
	Category    string `json:"category,omitempty"`
	Limit       int    `json:"limit,omitempty"`
	Offset      int    `json:"offset,omitempty"`
}

// SearchResult represents search results from catalog queries
type SearchResult struct {
	Packages    []*model.Package `json:"packages,omitempty"`
	TotalCount  int              `json:"totalCount"`
	Limit       int              `json:"limit"`
	Offset      int              `json:"offset"`
	CatalogName string           `json:"catalogName"`
}

package olm

// CatalogItem represents a single item in the catalog.
type CatalogItem struct {
	Capabilities           string   `json:"capabilities,omitempty"`
	Categories             []string `json:"categories,omitempty"`
	CreatedAt              string   `json:"createdAt,omitempty"`
	Description            string   `json:"description,omitempty"`
	DisplayName            string   `json:"displayName,omitempty"`
	Image                  string   `json:"image,omitempty"`
	InfrastructureFeatures []string `json:"infrastructureFeatures,omitempty"`
	Keywords               []string `json:"keywords,omitempty"`
	LongDescription        string   `json:"longDescription,omitempty"`
	Provider               string   `json:"provider,omitempty"`
	Repository             string   `json:"repository,omitempty"`
	Source                 string   `json:"source,omitempty"`
	Support                string   `json:"support,omitempty"`
	ValidSubscription      []string `json:"validSubscription,omitempty"`
	Catalog                string   `json:"catalog"`
	Name                   string   `json:"name"`
	Version                string   `json:"version"`
}

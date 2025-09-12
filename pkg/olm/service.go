package olm

type CatalogService interface {
	UpdateCatalog(string, string) error
	RemoveCatalog(string) error
}

type DummyCatalogService struct{}

func NewDummyCatalogService() *DummyCatalogService {
	return &DummyCatalogService{}
}

func (d *DummyCatalogService) UpdateCatalog(catalog string, baseURL string) error {
	// TODO
	return nil
}

func (d *DummyCatalogService) RemoveCatalog(catalog string) error {
	// TODO
	return nil
}

package olm

import (
	"net/http"
)

type OLMHandler struct {
	client         *http.Client
	catalogService *catalogService
	apiServerURL   string
	mux            *http.ServeMux
}

func NewOLMHandler(apiServerURL string, client *http.Client, service *catalogService) http.Handler {
	o := &OLMHandler{
		apiServerURL:   apiServerURL,
		client:         client,
		catalogService: service,
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/olm/catalog-items/", o.catalogItemsHandler)
	mux.HandleFunc("/api/olm/list-operands/", o.operandsListHandler)
	mux.HandleFunc("/api/olm/check-package-manifests/", o.checkPackageManifestHandler)
	o.mux = mux
	return o
}

func (o *OLMHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	o.mux.ServeHTTP(w, r)
}

package olm

import (
	"encoding/json"
	"net/http"

	"github.com/openshift/console/pkg/serverutils"
)

func (o *OLMHandler) catalogItemsHandler(w http.ResponseWriter, r *http.Request) {
	items, lastModified, stale := o.catalogService.GetCatalogItems(r)
	if stale {
		w.WriteHeader(http.StatusNotModified)
		return
	}

	w.Header().Set("Last-Modified", lastModified.UTC().Format(http.TimeFormat))
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(items); err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
}

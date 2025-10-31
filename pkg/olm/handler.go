package olm

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/operator-framework/kubectl-operator/pkg/action"
	olmv1 "github.com/operator-framework/operator-lifecycle-manager/pkg/package-server/apis/operators/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/serverutils"
)

type OLMHandler struct {
	client         *http.Client
	catalogService *CatalogService
	apiServerURL   string
	mux            *http.ServeMux
}

func NewOLMHandler(apiServerURL string, client *http.Client, service *CatalogService) http.Handler {
	o := &OLMHandler{
		apiServerURL:   apiServerURL,
		client:         client,
		catalogService: service,
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/olm/catalog-items/", o.catalogItemsHandler)
	mux.HandleFunc("/api/olm/catalogd/metas/{catalogName}", o.catalogdMetasHandler)
	mux.HandleFunc("/api/olm/list-operands/", o.operandsListHandler)
	mux.HandleFunc("/api/olm/check-package-manifests/", o.checkPackageManifestHandler)
	o.mux = mux
	return o
}

func (o *OLMHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	o.mux.ServeHTTP(w, r)
}

func (o *OLMHandler) catalogdMetasHandler(w http.ResponseWriter, r *http.Request) {
	catalogName := r.PathValue("catalogName")
	if catalogName == "" {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "catalog name is required"})
		return
	}

	resp, err := o.catalogService.GetMetas(catalogName, r)
	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer resp.Body.Close()

	w.WriteHeader(resp.StatusCode)
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
}

func (o *OLMHandler) catalogItemsHandler(w http.ResponseWriter, r *http.Request) {
	lastModified := o.catalogService.LastModified
	modified, err := serverutils.ModifiedSince(r, lastModified)
	if err != nil {
		klog.Error(err)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprintf("Invalid If-Modified-Since header: %v", err)})
		return
	}
	if !modified {
		klog.V(4).Info("catalog items not modified, returning 304")
		w.WriteHeader(http.StatusNotModified)
		return
	}

	klog.V(4).Info("catalog items modified, returning 200")
	items, err := o.catalogService.GetCatalogItems()
	if err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	if lastModified != "" {
		w.Header().Set("Last-Modified", lastModified)
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(items); err != nil {
		serverutils.SendResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
}

func (o *OLMHandler) checkPackageManifestHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Method unsupported, the only supported methods is GET"})
		return
	}

	operatorName, operatorNamespace, err := o.getOperatorMeta(r)
	if err != nil {
		klog.Error(err)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprint(err)})
		return
	}

	client, _, err := o.getClientWithScheme(nil)
	if err != nil {
		klog.Error(err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprint(err)})
		return
	}

	packageManifest := olmv1.PackageManifest{}
	err = client.Get(context.TODO(), types.NamespacedName{Name: operatorName, Namespace: operatorNamespace}, &packageManifest)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to get operator: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = json.Marshal(packageManifest)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to marshal %q operator response: %v", operatorName, err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}
	serverutils.SendResponse(w, http.StatusOK, nil)
}

func (o *OLMHandler) operandsListHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Method unsupported, the only supported methods is GET"})
		return
	}

	operatorName, operatorNamespace, err := o.getOperatorMeta(r)
	if err != nil {
		klog.Error(err)
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: fmt.Sprint(err)})
		return
	}

	client, scheme, err := o.getClientWithScheme(r)
	if err != nil {
		klog.Error(err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: fmt.Sprint(err)})
		return
	}

	cfg := &action.Configuration{
		Client:    client,
		Scheme:    scheme,
		Namespace: operatorNamespace,
	}
	operatorListOperands := action.NewOperatorListOperands(cfg)
	operandsList, err := operatorListOperands.Run(context.TODO(), operatorName)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to list operands: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusBadGateway, serverutils.ApiError{Err: errMsg})
		return
	}
	// Deduplicate operands by UID to prevent duplicate CRs
	if operandsList != nil && len(operandsList.Items) > 0 {
		operandsList.Items = deduplicateUnstructuredList(operandsList.Items)
	}

	w.Header().Set("Content-Type", "application/json")
	resp, err := json.Marshal(operandsList)
	if err != nil {
		errMsg := fmt.Sprintf("Failed to marshal the list operands response: %v", err)
		klog.Error(errMsg)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{Err: errMsg})
		return
	}
	w.Write(resp)
}

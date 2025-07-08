package olmv1

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/serverutils"
	"github.com/operator-framework/operator-registry/alpha/model"
	"k8s.io/klog/v2"
)

// Handlers provides HTTP handlers for OLMv1 API endpoints
type Handlers struct {
	controller *Controller
}

// NewHandlers creates new HTTP handlers for OLMv1 endpoints
func NewHandlers(controller *Controller) *Handlers {
	return &Handlers{
		controller: controller,
	}
}

// HandleCatalogs handles requests for catalog information
// GET /api/olmv1/catalogs - returns all catalogs
// GET /api/olmv1/catalogs/{name} - returns specific catalog
func (h *Handlers) HandleCatalogs(user *auth.User, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{
			Err: "Method not allowed, only GET is supported",
		})
		return
	}

	// Extract catalog name from path if present
	path := strings.TrimPrefix(r.URL.Path, "/api/olmv1/catalogs")
	path = strings.TrimPrefix(path, "/")

	if path == "" {
		// Return all catalogs
		h.handleListCatalogs(w, r)
	} else {
		// Return specific catalog
		h.handleGetCatalog(w, r, path)
	}
}

// handleListCatalogs returns a list of all available catalogs
func (h *Handlers) handleListCatalogs(w http.ResponseWriter, r *http.Request) {
	cache := h.controller.GetCache()
	allCatalogs := cache.GetAllCatalogs()

	type CatalogSummary struct {
		Name         string `json:"name"`
		BaseURL      string `json:"baseURL"`
		PackageCount int    `json:"packageCount"`
		ObjectCount  int    `json:"objectCount"`
		LastUpdated  string `json:"lastUpdated"`
	}

	catalogs := make([]CatalogSummary, 0, len(allCatalogs))
	for _, index := range allCatalogs {
		catalogs = append(catalogs, CatalogSummary{
			Name:         index.CatalogName,
			BaseURL:      index.BaseURL,
			PackageCount: len(index.Model),
			ObjectCount:  index.ObjectCount,
			LastUpdated:  index.LastUpdated,
		})
	}

	serverutils.SendResponse(w, http.StatusOK, map[string]interface{}{
		"catalogs": catalogs,
		"count":    len(catalogs),
	})
}

// handleGetCatalog returns details for a specific catalog
func (h *Handlers) handleGetCatalog(w http.ResponseWriter, r *http.Request, catalogName string) {
	cache := h.controller.GetCache()
	index, exists := cache.GetCatalog(catalogName)
	if !exists {
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{
			Err: fmt.Sprintf("Catalog %s not found", catalogName),
		})
		return
	}

	serverutils.SendResponse(w, http.StatusOK, index)
}

// HandlePackages handles requests for package information
// GET /api/olmv1/packages?catalog=name&search=query&limit=10&offset=0
func (h *Handlers) HandlePackages(user *auth.User, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{
			Err: "Method not allowed, only GET is supported",
		})
		return
	}

	// Parse query parameters
	filter := h.parseSearchFilter(r)

	// Perform search
	result, err := h.searchPackages(filter)
	if err != nil {
		klog.Errorf("Package search failed: %v", err)
		serverutils.SendResponse(w, http.StatusInternalServerError, serverutils.ApiError{
			Err: "Internal server error",
		})
		return
	}

	serverutils.SendResponse(w, http.StatusOK, result)
}

// parseSearchFilter parses query parameters into a SearchFilter
func (h *Handlers) parseSearchFilter(r *http.Request) SearchFilter {
	query := r.URL.Query()

	filter := SearchFilter{
		PackageName: query.Get("package"),
		Channel:     query.Get("channel"),
		Keywords:    query.Get("search"),
		Category:    query.Get("category"),
		Limit:       20, // default
		Offset:      0,  // default
	}

	// Parse limit
	if limitStr := query.Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 && limit <= 100 {
			filter.Limit = limit
		}
	}

	// Parse offset
	if offsetStr := query.Get("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil && offset >= 0 {
			filter.Offset = offset
		}
	}

	return filter
}

// searchPackages performs package search across catalogs
func (h *Handlers) searchPackages(filter SearchFilter) (*SearchResult, error) {
	cache := h.controller.GetCache()
	allCatalogs := cache.GetAllCatalogs()

	var allPackages []*model.Package

	// Collect packages from all catalogs
	for catalogName, index := range allCatalogs {
		for _, pkg := range index.Model {
			// Apply filters
			if filter.PackageName != "" && !strings.Contains(pkg.Name, filter.PackageName) {
				continue
			}

			// Simple keyword search in name and description
			if filter.Keywords != "" {
				keywords := strings.ToLower(filter.Keywords)
				if !strings.Contains(strings.ToLower(pkg.Name), keywords) &&
					!strings.Contains(strings.ToLower(pkg.Description), keywords) {
					continue
				}
			}

			// Create a copy with catalog info
			pkgCopy := *pkg
			pkgCopy.Name = fmt.Sprintf("%s/%s", catalogName, pkg.Name)
			allPackages = append(allPackages, &pkgCopy)
		}
	}

	// Apply pagination
	totalCount := len(allPackages)
	start := filter.Offset
	end := filter.Offset + filter.Limit

	if start >= totalCount {
		allPackages = []*model.Package{}
	} else {
		if end > totalCount {
			end = totalCount
		}
		allPackages = allPackages[start:end]
	}

	return &SearchResult{
		Packages:   allPackages,
		TotalCount: totalCount,
		Limit:      filter.Limit,
		Offset:     filter.Offset,
	}, nil
}

// HandleChannels handles requests for channel information
// GET /api/olmv1/channels/{catalog}/{package}
func (h *Handlers) HandleChannels(user *auth.User, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{
			Err: "Method not allowed, only GET is supported",
		})
		return
	}

	// Extract catalog and package from path
	path := strings.TrimPrefix(r.URL.Path, "/api/olmv1/channels/")
	parts := strings.Split(path, "/")

	if len(parts) != 2 {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{
			Err: "Invalid path format. Expected: /api/olmv1/channels/{catalog}/{package}",
		})
		return
	}

	catalogName := parts[0]
	packageName := parts[1]

	cache := h.controller.GetCache()
	index, exists := cache.GetCatalog(catalogName)
	if !exists {
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{
			Err: fmt.Sprintf("Catalog %s not found", catalogName),
		})
		return
	}

	pkg := index.GetPackage(packageName)
	if pkg == nil {
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{
			Err: fmt.Sprintf("Package %s not found in catalog %s", packageName, catalogName),
		})
		return
	}

	channels := index.GetChannels(packageName)
	serverutils.SendResponse(w, http.StatusOK, map[string]interface{}{
		"catalog":        catalogName,
		"package":        packageName,
		"channels":       channels,
		"defaultChannel": pkg.DefaultChannel,
	})
}

// HandleBundles handles requests for bundle information
// GET /api/olmv1/bundles/{catalog}/{package}/{channel}
func (h *Handlers) HandleBundles(user *auth.User, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{
			Err: "Method not allowed, only GET is supported",
		})
		return
	}

	// Extract catalog, package, and channel from path
	path := strings.TrimPrefix(r.URL.Path, "/api/olmv1/bundles/")
	parts := strings.Split(path, "/")

	if len(parts) != 3 {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{
			Err: "Invalid path format. Expected: /api/olmv1/bundles/{catalog}/{package}/{channel}",
		})
		return
	}

	catalogName := parts[0]
	packageName := parts[1]
	channelName := parts[2]

	cache := h.controller.GetCache()
	index, exists := cache.GetCatalog(catalogName)
	if !exists {
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{
			Err: fmt.Sprintf("Catalog %s not found", catalogName),
		})
		return
	}

	bundles := index.GetBundles(packageName, channelName)
	if bundles == nil {
		serverutils.SendResponse(w, http.StatusNotFound, serverutils.ApiError{
			Err: fmt.Sprintf("Channel %s not found for package %s in catalog %s", channelName, packageName, catalogName),
		})
		return
	}

	serverutils.SendResponse(w, http.StatusOK, map[string]interface{}{
		"catalog": catalogName,
		"package": packageName,
		"channel": channelName,
		"bundles": bundles,
	})
}

// HandleStatus provides overall status of the OLMv1 backend
// GET /api/olmv1/status
func (h *Handlers) HandleStatus(user *auth.User, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{
			Err: "Method not allowed, only GET is supported",
		})
		return
	}

	cache := h.controller.GetCache()
	allCatalogs := cache.GetAllCatalogs()

	totalPackages := 0
	totalObjects := 0

	for _, index := range allCatalogs {
		totalPackages += len(index.Model)
		totalObjects += index.ObjectCount
	}

	status := map[string]interface{}{
		"healthy": true,
		"catalogs": map[string]interface{}{
			"total":  len(allCatalogs),
			"loaded": len(allCatalogs),
		},
		"packages": map[string]interface{}{
			"total": totalPackages,
		},
		"objects": map[string]interface{}{
			"total": totalObjects,
		},
		"backend": "olmv1",
		"version": "1.0.0",
	}

	serverutils.SendResponse(w, http.StatusOK, status)
}

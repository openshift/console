package olmv1

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/operator-framework/operator-registry/alpha/model"
	"github.com/operator-framework/operator-registry/alpha/property"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/client-go/dynamic"
	"k8s.io/klog/v2"
)

const (
	// How often to check for ClusterCatalog changes
	clusterCatalogRefreshInterval = 30 * time.Second
	// How long to wait before first refresh
	initialRefreshDelay = 5 * time.Second
	// FBC catalog data endpoint path
	fbcCatalogPath = "/v1/all"
)

// Controller manages ClusterCatalog resources and processes FBC data
type Controller struct {
	dynamicClient dynamic.Interface
	cache         *CatalogCache
	mu            sync.RWMutex
	stopCh        chan struct{}
	httpClient    *http.Client
}

// NewController creates a new OLMv1 controller
func NewController(dynamicClient dynamic.Interface) *Controller {
	return &Controller{
		dynamicClient: dynamicClient,
		cache:         NewCatalogCache(),
		stopCh:        make(chan struct{}),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Start begins the controller's reconciliation loop
func (c *Controller) Start(ctx context.Context) error {
	klog.Info("Starting OLMv1 controller")

	// Start reconciliation loop
	go c.reconcileLoop(ctx)

	// Wait for context cancellation
	<-ctx.Done()
	close(c.stopCh)
	return ctx.Err()
}

// reconcileLoop polls ClusterCatalog resources and updates the cache
func (c *Controller) reconcileLoop(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := c.reconcile(ctx); err != nil {
				klog.Errorf("Reconciliation failed: %v", err)
			}
		}
	}
}

// reconcile fetches ClusterCatalog resources and processes their FBC data
func (c *Controller) reconcile(ctx context.Context) error {
	// Get all ClusterCatalog resources
	list, err := c.dynamicClient.Resource(ClusterCatalogGVR).List(ctx, metav1.ListOptions{})
	if err != nil {
		return fmt.Errorf("failed to list ClusterCatalogs: %w", err)
	}

	for _, item := range list.Items {
		if err := c.processCatalog(ctx, &item); err != nil {
			klog.Errorf("Failed to process catalog %s: %v", item.GetName(), err)
		}
	}

	return nil
}

// processCatalog processes a single ClusterCatalog resource
func (c *Controller) processCatalog(ctx context.Context, catalog *unstructured.Unstructured) error {
	catalogName := catalog.GetName()

	// Extract baseURL from status
	status, exists, err := unstructured.NestedMap(catalog.Object, "status")
	if err != nil {
		return fmt.Errorf("failed to get status: %w", err)
	}
	if !exists {
		klog.Warningf("ClusterCatalog %s has no status", catalogName)
		return nil
	}

	baseURL, exists, err := unstructured.NestedString(status, "baseURL")
	if err != nil {
		return fmt.Errorf("failed to get baseURL: %w", err)
	}
	if !exists || baseURL == "" {
		klog.Warningf("ClusterCatalog %s has no baseURL", catalogName)
		return nil
	}

	// Check if we need to update this catalog
	existingIndex, exists := c.cache.GetCatalog(catalogName)
	if exists && existingIndex.BaseURL == baseURL {
		// No change needed
		return nil
	}

	klog.Infof("Processing catalog %s with baseURL %s", catalogName, baseURL)

	// Fetch and process FBC data
	catalogIndex, err := c.fetchAndProcessFBC(baseURL, catalogName)
	if err != nil {
		return fmt.Errorf("failed to process FBC data for %s: %w", catalogName, err)
	}

	// Update cache
	c.cache.SetCatalog(catalogName, catalogIndex)
	klog.Infof("Updated catalog %s with %d packages", catalogName, len(catalogIndex.Model))

	return nil
}

// fetchAndProcessFBC downloads and processes FBC data from catalogd
func (c *Controller) fetchAndProcessFBC(baseURL, catalogName string) (*CatalogIndex, error) {
	// Construct FBC endpoint URL
	fbcURL := strings.TrimSuffix(baseURL, "/") + "/all.json"

	klog.Infof("Fetching FBC data from %s", fbcURL)

	// Make HTTP request
	resp, err := c.httpClient.Get(fbcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch FBC data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch FBC data: status %d", resp.StatusCode)
	}

	// Process JSONL data
	catalogIndex, err := c.processFBCData(resp.Body, catalogName, baseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to process FBC data: %w", err)
	}

	return catalogIndex, nil
}

// processFBCData parses JSONL FBC data and builds a model
func (c *Controller) processFBCData(reader io.Reader, catalogName, baseURL string) (*CatalogIndex, error) {
	scanner := bufio.NewScanner(reader)
	modelBuilder := model.Model{}
	objectCount := 0

	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			continue
		}

		// Parse the FBC object
		var fbcObj map[string]interface{}
		if err := json.Unmarshal([]byte(line), &fbcObj); err != nil {
			klog.Warningf("Failed to parse FBC line: %v", err)
			continue
		}

		schema, ok := fbcObj["schema"].(string)
		if !ok {
			klog.Warning("FBC object missing schema field")
			continue
		}

		// Process based on schema type
		switch schema {
		case property.TypePackage:
			if err := c.processPackageObject(fbcObj, modelBuilder); err != nil {
				klog.Warningf("Failed to process package object: %v", err)
			}
		case property.TypeChannel:
			if err := c.processChannelObject(fbcObj, modelBuilder); err != nil {
				klog.Warningf("Failed to process channel object: %v", err)
			}
		case "olm.bundle":
			if err := c.processBundleObject(fbcObj, modelBuilder); err != nil {
				klog.Warningf("Failed to process bundle object: %v", err)
			}
		default:
			// Skip unknown schema types
			continue
		}

		objectCount++
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading FBC data: %w", err)
	}

	return &CatalogIndex{
		CatalogName: catalogName,
		BaseURL:     baseURL,
		Model:       modelBuilder,
		LastUpdated: time.Now().Format(time.RFC3339),
		ObjectCount: objectCount,
	}, nil
}

// processPackageObject processes an FBC package object
func (c *Controller) processPackageObject(fbcObj map[string]interface{}, modelBuilder model.Model) error {
	// Extract package data
	packageName, ok := fbcObj["name"].(string)
	if !ok {
		return fmt.Errorf("package missing name field")
	}

	// Create or get existing package
	pkg := modelBuilder[packageName]
	if pkg == nil {
		pkg = &model.Package{
			Name:        packageName,
			Description: "",
			Icon:        nil,
			Channels:    make(map[string]*model.Channel),
		}
		modelBuilder[packageName] = pkg
	}

	// Update package fields if available
	if description, ok := fbcObj["description"].(string); ok {
		pkg.Description = description
	}

	return nil
}

// processChannelObject processes an FBC channel object
func (c *Controller) processChannelObject(fbcObj map[string]interface{}, modelBuilder model.Model) error {
	// Extract channel data
	packageName, ok := fbcObj["package"].(string)
	if !ok {
		return fmt.Errorf("channel missing package field")
	}

	channelName, ok := fbcObj["name"].(string)
	if !ok {
		return fmt.Errorf("channel missing name field")
	}

	// Get or create package
	pkg := modelBuilder[packageName]
	if pkg == nil {
		pkg = &model.Package{
			Name:     packageName,
			Channels: make(map[string]*model.Channel),
		}
		modelBuilder[packageName] = pkg
	}

	// Create channel
	channel := &model.Channel{
		Package: pkg,
		Name:    channelName,
		Bundles: make(map[string]*model.Bundle),
	}

	// Extract entries (bundle references)
	if entries, ok := fbcObj["entries"].([]interface{}); ok {
		for _, entry := range entries {
			if entryMap, ok := entry.(map[string]interface{}); ok {
				if bundleName, ok := entryMap["name"].(string); ok {
					// Create placeholder bundle (will be populated when we process bundle objects)
					if channel.Bundles[bundleName] == nil {
						channel.Bundles[bundleName] = &model.Bundle{
							Package: pkg,
							Channel: channel,
							Name:    bundleName,
						}
					}
				}
			}
		}
	}

	pkg.Channels[channelName] = channel
	return nil
}

// processBundleObject processes an FBC bundle object
func (c *Controller) processBundleObject(fbcObj map[string]interface{}, modelBuilder model.Model) error {
	// Extract bundle data
	packageName, ok := fbcObj["package"].(string)
	if !ok {
		return fmt.Errorf("bundle missing package field")
	}

	bundleName, ok := fbcObj["name"].(string)
	if !ok {
		return fmt.Errorf("bundle missing name field")
	}

	// Get or create package
	pkg := modelBuilder[packageName]
	if pkg == nil {
		pkg = &model.Package{
			Name:     packageName,
			Channels: make(map[string]*model.Channel),
		}
		modelBuilder[packageName] = pkg
	}

	// Create bundle
	bundle := &model.Bundle{
		Package: pkg,
		Name:    bundleName,
	}

	// Extract additional bundle fields
	if image, ok := fbcObj["image"].(string); ok {
		bundle.Image = image
	}

	// Properties will be processed separately if needed
	if properties, ok := fbcObj["properties"].([]interface{}); ok {
		// Process properties using the official property types
		for _, prop := range properties {
			if propMap, ok := prop.(map[string]interface{}); ok {
				// Handle different property types as needed
				if propType, ok := propMap["type"].(string); ok {
					switch propType {
					case property.TypePackage:
						// Handle package properties
					case property.TypeGVK:
						// Handle GVK properties
						// Add more property type handling as needed
					}
				}
			}
		}
	}

	// Add bundle to all channels that reference it
	for _, channel := range pkg.Channels {
		if existingBundle := channel.Bundles[bundleName]; existingBundle != nil {
			// Update the placeholder with real data
			*existingBundle = *bundle
			existingBundle.Channel = channel
		}
	}

	return nil
}

// GetCache returns the controller's cache for external access
func (c *Controller) GetCache() *CatalogCache {
	return c.cache
}

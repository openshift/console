package olmv1

import (
	"sync"
	"time"
)

// CatalogCache provides thread-safe storage for processed FBC data
type CatalogCache struct {
	mu       sync.RWMutex
	catalogs map[string]*CatalogIndex
}

// NewCatalogCache creates a new catalog cache
func NewCatalogCache() *CatalogCache {
	return &CatalogCache{
		catalogs: make(map[string]*CatalogIndex),
	}
}

// SetCatalog stores processed FBC data for a catalog
func (c *CatalogCache) SetCatalog(catalogName string, index *CatalogIndex) {
	c.mu.Lock()
	defer c.mu.Unlock()

	index.LastUpdated = time.Now().UTC().Format(time.RFC3339)
	c.catalogs[catalogName] = index
}

// GetCatalog retrieves processed FBC data for a catalog
func (c *CatalogCache) GetCatalog(catalogName string) (*CatalogIndex, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	index, exists := c.catalogs[catalogName]
	return index, exists
}

// GetAllCatalogs returns all cached catalog data
func (c *CatalogCache) GetAllCatalogs() map[string]*CatalogIndex {
	c.mu.RLock()
	defer c.mu.RUnlock()

	// Return a copy to prevent external modification
	result := make(map[string]*CatalogIndex)
	for name, index := range c.catalogs {
		result[name] = index
	}
	return result
}

// DeleteCatalog removes a catalog from the cache
func (c *CatalogCache) DeleteCatalog(catalogName string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.catalogs, catalogName)
}

// ListCatalogNames returns the names of all cached catalogs
func (c *CatalogCache) ListCatalogNames() []string {
	c.mu.RLock()
	defer c.mu.RUnlock()

	names := make([]string, 0, len(c.catalogs))
	for name := range c.catalogs {
		names = append(names, name)
	}
	return names
}

// GetCatalogCount returns the number of cached catalogs
func (c *CatalogCache) GetCatalogCount() int {
	c.mu.RLock()
	defer c.mu.RUnlock()

	return len(c.catalogs)
}

// Clear removes all catalogs from the cache
func (c *CatalogCache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.catalogs = make(map[string]*CatalogIndex)
}

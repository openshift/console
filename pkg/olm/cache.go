package olm

import (
	"net/http"
	"sync"
	"time"
)

// CatalogCache holds the catalog items and provides a thread-safe way to update and access them.
type catalogCache struct {
	mutex        sync.RWMutex
	catalogItems map[string][]CatalogItem
	lastModified time.Time
}

// UpdateCatalog replaces the cached items for a given catalog.
func (c *catalogCache) UpdateCatalog(catalogName string, items []CatalogItem) {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.catalogItems[catalogName] = items
	c.lastModified = time.Now()
}

// GetCatalogItems returns a copy of the catalog items from the cache and checks if the client's version is stale.
func (c *catalogCache) GetCatalogItems(r *http.Request) ([]CatalogItem, time.Time, bool) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	if t, err := time.Parse(http.TimeFormat, r.Header.Get("If-Modified-Since")); err == nil && !c.lastModified.IsZero() && c.lastModified.Before(t.Add(1*time.Second)) {
		return nil, c.lastModified, true
	}

	var allItems []CatalogItem
	for _, items := range c.catalogItems {
		allItems = append(allItems, items...)
	}

	return allItems, c.lastModified, false
}

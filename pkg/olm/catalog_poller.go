package olm

import (
	"time"

	"k8s.io/klog/v2"
)

// CatalogPoller is responsible for periodically fetching catalog data and updating the cache.
// TODO: This is a placeholder for the catalog controller that will be implemented in the future.
type catalogPoller struct {
	fetcher *catalogFetcher
	cache   *catalogCache
	ticker  *time.Ticker
	done    chan bool
}

// Start begins the polling process.
func (p *catalogPoller) Start() {
	klog.Info("Starting catalog poller")
	go func() {
		for {
			select {
			case <-p.done:
				return
			case <-p.ticker.C:
				p.poll()
			}
		}
	}()
}

// Stop halts the polling process.
func (p *catalogPoller) Stop() {
	klog.Info("Stopping catalog poller")
	p.ticker.Stop()
	p.done <- true
}

func (p *catalogPoller) poll() {
	// In a real implementation, you would get the list of catalogs from a dynamic source.
	// For now, we'll hardcode a list of catalogs to poll.
	catalogsToPoll := []string{"community-operators"}

	for _, catalogName := range catalogsToPoll {
		klog.V(4).Infof("Polling catalog: %s", catalogName)
		items, err := p.fetcher.FetchAndTransformCatalog(catalogName)
		if err != nil {
			klog.Errorf("Errors encountered while fetching catalog %s: %v", catalogName, err)
			continue
		}
		p.cache.UpdateCatalog(catalogName, items)
		klog.V(4).Infof("Successfully updated cache for catalog: %s", catalogName)
	}
}

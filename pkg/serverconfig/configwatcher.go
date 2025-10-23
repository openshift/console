package serverconfig

import (
	"context"
	"os"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"k8s.io/klog/v2"
)

const defaultWatchInterval = 30 * time.Second

// ConfigWatcher watches a configuration file for changes.
type ConfigWatcher struct {
	sync.RWMutex

	configPath string
	watcher    *fsnotify.Watcher
	interval   time.Duration

	// callback is a function to be invoked when the config file changes.
	callback func()
}

// NewConfigWatcher returns a new ConfigWatcher watching the given config file.
func NewConfigWatcher(configPath string, callback func()) (*ConfigWatcher, error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}

	cw := &ConfigWatcher{
		configPath: configPath,
		watcher:    watcher,
		interval:   defaultWatchInterval,
		callback:   callback,
	}

	return cw, nil
}

// Start starts watching the config file for changes.
func (cw *ConfigWatcher) Start(ctx context.Context) error {
	if cw.configPath == "" {
		klog.Info("No config file specified, skipping config file watcher")
		return nil
	}

	// Add the config file to the watcher
	if err := cw.watcher.Add(cw.configPath); err != nil {
		return err
	}

	go cw.watch()

	ticker := time.NewTicker(cw.interval)
	defer ticker.Stop()

	klog.Infof("Starting config file watcher for %s", cw.configPath)
	for {
		select {
		case <-ctx.Done():
			return cw.watcher.Close()
		case <-ticker.C:
			// Periodic check to ensure the file still exists
			if _, err := os.Stat(cw.configPath); err != nil {
				klog.Warningf("Config file no longer accessible: %v", err)
			}
		}
	}
}

// watch reads events from the watcher's channel and reacts to changes.
func (cw *ConfigWatcher) watch() {
	for {
		select {
		case event, ok := <-cw.watcher.Events:
			// Channel is closed.
			if !ok {
				return
			}

			cw.handleEvent(event)
		case err, ok := <-cw.watcher.Errors:
			// Channel is closed.
			if !ok {
				return
			}

			klog.Errorf("Config file watch error: %v", err)
		}
	}
}

func (cw *ConfigWatcher) handleEvent(event fsnotify.Event) {
	// Only care about events which may modify the contents of the file.
	switch {
	case event.Op.Has(fsnotify.Write):
	case event.Op.Has(fsnotify.Create):
	case event.Op.Has(fsnotify.Chmod), event.Op.Has(fsnotify.Remove):
		// If the file was removed or renamed, re-add the watch to the previous name
		if err := cw.watcher.Add(event.Name); err != nil {
			klog.Errorf("Error re-watching config file: %v", err)
		}
	default:
		return
	}

	klog.Infof("Config file changed: %v", event)

	// Invoke the callback to trigger server restart
	if cw.callback != nil {
		go cw.callback()
	}
}

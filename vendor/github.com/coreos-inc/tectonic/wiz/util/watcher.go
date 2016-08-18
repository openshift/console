package util

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Sirupsen/logrus"
)

// DoFuncOnDirChange will watch the given directory for changes and perform f() whenever there's a change.
func DoFuncOnDirChange(dir string, logger *logrus.Entry, f func() error) {
	t := time.Tick(1 * time.Second)
	last := time.Now()
	var changed os.FileInfo
	for _ = range t {
		filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
			if info.IsDir() {
				return nil
			}
			if strings.HasPrefix(info.Name(), ".#") {
				return nil
			}
			if err != nil {
				panic(err)
			}
			if info.ModTime().After(last) {
				changed = info
				return errors.New("reparse")
			}
			return nil
		})
		if changed != nil {
			logger.Infof("Change found in %s, reloading", changed.Name())
			last = time.Now()

			err := f()
			if err != nil {
				panic(err)
			}
			changed = nil
		}
	}
}

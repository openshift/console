// Package asset abstracts generated asset representations.
package asset

import (
	"fmt"
)

// Asset is a named byte slice.
type Asset interface {
	Name() string
	Data() []byte
}

// An asset is an in-memory Asset.
type asset struct {
	name string
	data []byte
}

// New returns a new Asset.
func New(name string, data []byte) Asset {
	return asset{
		name: name,
		data: data,
	}
}

// Name returns the name of the asset.
func (a asset) Name() string {
	return a.name
}

// Data returns the byte contents of the asset.
func (a asset) Data() []byte {
	return a.data
}

// Find returns the Asset with the given name.
func Find(assets []Asset, name string) (Asset, error) {
	for _, a := range assets {
		if a.Name() == name {
			return a, nil
		}
	}
	return asset{}, fmt.Errorf("Asset %q was not found", name)
}

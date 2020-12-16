package common

import (
	"reflect"

	"github.com/devfile/api/pkg/attributes"
)

// DevfileOptions provides options for Devfile operations
type DevfileOptions struct {
	// Filter is a map that lets you filter devfile object against their attributes. Interface can be string, float, boolean or a map
	Filter map[string]interface{}
}

// FilterDevfileObject filters devfile attributes with the given options
func FilterDevfileObject(attributes attributes.Attributes, options DevfileOptions) (bool, error) {
	var err error
	filterIn := true
	for key, value := range options.Filter {
		currentFilterIn := false
		attrValue := attributes.Get(key, &err)
		if err != nil {
			return false, err
		} else if reflect.DeepEqual(attrValue, value) {
			currentFilterIn = true
		}

		filterIn = filterIn && currentFilterIn
	}

	return filterIn, nil
}

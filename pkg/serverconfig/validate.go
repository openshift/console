package serverconfig

import (
	"encoding/json"
	"flag"
	"fmt"
	"strings"

	"github.com/openshift/console/pkg/bridge"
)

func Validate(fs *flag.FlagSet) error {
	if _, err := validateDeveloperCatalogCategories(fs.Lookup("developer-catalog-categories").Value.String()); err != nil {
		return err
	}

	bridge.ValidateFlagIs("user-settings-location", fs.Lookup("user-settings-location").Value.String(), "configmap", "localstorage")

	return nil
}

func validateDeveloperCatalogCategories(value string) ([]DeveloperConsoleCatalogCategory, error) {
	if value == "" {
		return nil, nil
	}
	var categories []DeveloperConsoleCatalogCategory

	decoder := json.NewDecoder(strings.NewReader(value))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&categories); err != nil {
		return nil, err
	}

	for categoryIndex, category := range categories {
		if category.ID == "" || category.Label == "" {
			return categories, fmt.Errorf("Developer catalog category at index %d must have at least id and label properties.", categoryIndex)
		}
		for subcategoryIndex, subcategory := range category.Subcategories {
			if subcategory.ID == "" || subcategory.Label == "" {
				return categories, fmt.Errorf("Developer catalog subcategory at index %d of category \"%s\" must have at least id and label properties.", subcategoryIndex, category.ID)
			}
		}
	}

	return categories, nil
}

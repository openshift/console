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

	if _, err := validateQuickStarts(fs.Lookup("quick-starts").Value.String()); err != nil {
		return err
	}

	if _, err := validateAddPage(fs.Lookup("add-page").Value.String()); err != nil {
		return err
	}

	if _, err := validateProjectAccessClusterRolesJSON(fs.Lookup("project-access-cluster-roles").Value.String()); err != nil {
		return err
	}

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

func validateQuickStarts(value string) (QuickStarts, error) {
	if value == "" {
		return QuickStarts{}, nil
	}
	var quickStarts QuickStarts

	decoder := json.NewDecoder(strings.NewReader(value))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&quickStarts); err != nil {
		return QuickStarts{}, err
	}

	return quickStarts, nil
}

func validateAddPage(value string) (*AddPage, error) {
	if value == "" {
		return nil, nil
	}
	var addPage AddPage

	decoder := json.NewDecoder(strings.NewReader(value))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&addPage); err != nil {
		return nil, err
	}

	for index, action := range addPage.DisabledActions {
		if action == "" {
			return &addPage, fmt.Errorf("Add page disabled action at index %d must not be empty.", index)
		}
	}

	return &addPage, nil
}

func validateProjectAccessClusterRolesJSON(value string) ([]string, error) {
	if value == "" {
		return nil, nil
	}
	var projectAccessOptions []string

	decoder := json.NewDecoder(strings.NewReader(value))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&projectAccessOptions); err != nil {
		return nil, err
	}

	return projectAccessOptions, nil
}

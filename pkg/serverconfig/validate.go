package serverconfig

import (
	"encoding/json"
	"flag"
	"fmt"
	"strings"

	configv1 "github.com/openshift/api/config/v1"
	"github.com/openshift/console/pkg/bridge"
)

func Validate(fs *flag.FlagSet) error {
	if _, err := validateDeveloperCatalogCategories(fs.Lookup("developer-catalog-categories").Value.String()); err != nil {
		return err
	}

	if _, err := validateDeveloperCatalogTypes(fs.Lookup("developer-catalog-types").Value.String()); err != nil {
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

	if _, err := validatePerspectives(fs.Lookup("perspectives").Value.String()); err != nil {
		return err
	}

	if _, err := validateControlPlaneTopology(fs.Lookup("control-plane-topology-mode").Value.String()); err != nil {
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

func validateDeveloperCatalogTypes(value string) (DeveloperConsoleCatalogTypesState, error) {
	if value == "" {
		return DeveloperConsoleCatalogTypesState{}, nil
	}
	var developerCatalogTypesState DeveloperConsoleCatalogTypesState
	decoder := json.NewDecoder(strings.NewReader(value))
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&developerCatalogTypesState); err != nil {
		return DeveloperConsoleCatalogTypesState{}, err
	}

	return developerCatalogTypesState, nil
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

func validateControlPlaneTopology(value string) (string, error) {
	if value == "" {
		return value, nil
	}

	if !(value == string(configv1.SingleReplicaTopologyMode) ||
		value == string(configv1.HighlyAvailableTopologyMode) ||
		value == string(configv1.ExternalTopologyMode)) {
		return value, fmt.Errorf("ControlPlaneTopologyMode %s is not valid; valid options are External, HighlyAvailable, or SingleReplica", value)
	}

	return value, nil
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

func validatePerspectives(value string) ([]Perspective, error) {
	if value == "" {
		return nil, nil
	}
	var perspectives []Perspective

	decoder := json.NewDecoder(strings.NewReader(value))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&perspectives); err != nil {
		return nil, err
	}

	for perspectiveIndex, perspective := range perspectives {
		if perspective.ID == "" {
			return perspectives, fmt.Errorf("Perspective at index %d must have id property.", perspectiveIndex)
		}
		if perspective.Visibility.State == "" {
			return perspectives, fmt.Errorf("Perspective id %s must have visibility property.", perspective.ID)
		}
		if perspective.Visibility.State != PerspectiveDisabled && perspective.Visibility.State != PerspectiveEnabled && perspective.Visibility.State != PerspectiveAccessReview {
			return perspectives, fmt.Errorf("Perspective state for id %s must have value \"Enabled\" or \"Disabled\" or \"AccessReview\".", perspective.ID)
		}
		if perspective.Visibility.State == "AccessReview" && perspective.Visibility.AccessReview == nil {
			return perspectives, fmt.Errorf("Perspective accessReview for id %s must be configured for state AccessReview.", perspective.ID)
		}
		if perspective.Visibility.State == "AccessReview" && len(perspective.Visibility.AccessReview.Required) == 0 && len(perspective.Visibility.AccessReview.Missing) == 0 {
			return perspectives, fmt.Errorf("Perspective accessReview for id %s must have atleast required or missing property as non-empty.", perspective.ID)
		}
	}

	return perspectives, nil
}

// TODO remove multicluster
func ValidateManagedClusterConfig(managedCluster ManagedClusterConfig) error {
	errors := []string{}
	if managedCluster.Name == "" {
		errors = append(errors, "Name is required.")
	}

	if managedCluster.OAuth.ClientID == "" {
		errors = append(errors, "Oauth.ClientID is required.")
	}

	if managedCluster.OAuth.ClientSecret == "" {
		errors = append(errors, "OAuth.ClientSecret is required.")
	}

	if managedCluster.OAuth.CAFile == "" {
		errors = append(errors, "OAuth.CAFile is required.")
	}

	if len(errors) > 0 {
		return fmt.Errorf("\n\t- %s\n", strings.Join(errors, "\n\t- "))
	}

	return nil
}

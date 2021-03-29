package serverconfig

import (
	"errors"
	"reflect"
	"testing"
)

func TestValidEmptyDeveloperCatalogCategories(t *testing.T) {
	actualCategories, err := validateDeveloperCatalogCategories("")
	if err != nil {
		t.Error("Unexpected error when parsing an empty string.", err)
	}
	if actualCategories != nil {
		t.Errorf("Unexpected value: actual %v, expected %v", actualCategories, nil)
	}
}

func TestValidEmptyArrayForDeveloperCatalogCategories(t *testing.T) {
	actualCategories, err := validateDeveloperCatalogCategories("[]")
	if err != nil {
		t.Error("Unexpected error when parsing an empty array.", err)
	}
	if actualCategories == nil {
		t.Errorf("Unexpected value: actual %v, expected %v", actualCategories, nil)
	}
	if len(actualCategories) != 0 {
		t.Errorf("Unexpected value: actual %v, expected %v", len(actualCategories), 0)
	}
}

func TestValidDeveloperCatalogCategories(t *testing.T) {
	actualCategories, err := validateDeveloperCatalogCategories("[{ \"id\": \"java\", \"label\": \"Java\", \"tags\": [ \"jvm\", \"java\", \"quarkus\" ] }]")
	if err != nil {
		t.Error("Unexpected error when parsing an empty array.", err)
	}
	if actualCategories == nil {
		t.Errorf("Unexpected value: actual %v, expected %v", actualCategories, nil)
	}
	if len(actualCategories) != 1 {
		t.Errorf("Unexpected value: actual %v, expected %v", len(actualCategories), 1)
	}
	if actualCategories[0].ID != "java" {
		t.Errorf("Unexpected value: actual %v, expected %v", actualCategories[0].ID, "java")
	}
	if actualCategories[0].Label != "Java" {
		t.Errorf("Unexpected value: actual %v, expected %v", actualCategories[0].Label, "Java")
	}
	if len(actualCategories[0].Tags) != 3 {
		t.Errorf("Unexpected value: actual %v, expected %v", len(actualCategories[0].Tags), 3)
	}
}

func TestInvalidObjectForDeveloperCatalogCategories(t *testing.T) {
	_, err := validateDeveloperCatalogCategories("{}")
	if err == nil {
		t.Error("Expected an error when parsing an object.")
	}
}

func TestIncompleteDeveloperCatalogCategory(t *testing.T) {
	_, err := validateDeveloperCatalogCategories("[{}]")
	actualMsg := err.Error()
	expectedMsg := "Developer catalog category at index 0 must have at least id and label properties."
	if actualMsg != expectedMsg {
		t.Errorf("Unexpected error: actual\n%s\n, expected\n%s", actualMsg, expectedMsg)
	}
}

func TestIncompleteDeveloperCatalogSubcategory(t *testing.T) {
	_, err := validateDeveloperCatalogCategories("[{ \"id\": \"java\", \"label\": \"Java\", \"tags\": [ \"jvm\", \"java\", \"quarkus\" ], \"subcategories\": [ {} ] }]")
	actualMsg := err.Error()
	expectedMsg := "Developer catalog subcategory at index 0 of category \"java\" must have at least id and label properties."
	if actualMsg != expectedMsg {
		t.Errorf("Unexpected error: actual\n%s\n, expected\n%s", actualMsg, expectedMsg)
	}
}

func TestUnknownPropertyInDeveloperCatalogCategory(t *testing.T) {
	_, err := validateDeveloperCatalogCategories("[{ \"unknown key\": \"ignored value\" }]")
	actualMsg := err.Error()
	expectedMsg := "json: unknown field \"unknown key\""
	if actualMsg != expectedMsg {
		t.Errorf("Unexpected error: actual\n%s\n, expected\n%s", actualMsg, expectedMsg)
	}
}

func TestValidEmptyQuickStarts(t *testing.T) {
	_, err := validateQuickStarts("")
	if err != nil {
		t.Error("Unexpected error when parsing an empty string.", err)
	}
}

func TestValidObjectForQuickStarts(t *testing.T) {
	quickStarts, err := validateQuickStarts("{ \"disabled\": [ \"quickstarts0\", \"quickstarts1\", \"quickstarts2\" ] }")
	if err != nil {
		t.Error("Unexpected error when parsing data.", err)
	}
	if quickStarts.Disabled == nil {
		t.Errorf("Unexpected value: actual %v, expected array of strings", quickStarts.Disabled)
	}
	if len(quickStarts.Disabled) != 3 {
		t.Errorf("Unexpected value: actual %v, expected %v", len(quickStarts.Disabled), 3)
	}
}

func TestValidAddPage(t *testing.T) {
	tests := []struct {
		testcase      string
		input         string
		expectedData  *AddPage
		expectedError error
	}{
		{
			testcase:      "empty data",
			input:         "",
			expectedData:  nil,
			expectedError: nil,
		},
		{
			testcase:      "invalid json",
			input:         "invalid json",
			expectedData:  nil,
			expectedError: errors.New("invalid character 'i' looking for beginning of value"),
		},
		{
			testcase: "two valid disabled actions",
			input:    "{ \"disabledActions\": [ \"action1\", \"action2\" ] }",
			expectedData: &AddPage{
				DisabledActions: []string{
					"action1",
					"action2",
				},
			},
			expectedError: nil,
		},
	}

	for _, test := range tests {
		t.Run(test.testcase, func(t *testing.T) {
			actualData, actualError := validateAddPage(test.input)
			if !reflect.DeepEqual(test.expectedData, actualData) {
				t.Errorf("Data does not match expectation:\n%v\nbut got\n%v", test.expectedData, actualData)
			}
			if test.expectedError == nil && actualError != nil {
				t.Errorf("Error does not match expectation:\n%v\nbut got\n%v", test.expectedError, actualError)
			} else if test.expectedError != nil && (actualError == nil || test.expectedError.Error() != actualError.Error()) {
				t.Errorf("Error does not match expectation:\n%v\nbut got\n%v", test.expectedError, actualError)
			}
		})
	}
}

func TestValidEmptyProjectAccessClusterRoles(t *testing.T) {
	_, err := validateProjectAccessClusterRolesJSON("")
	if err != nil {
		t.Error("Unexpected error when parsing an empty string.", err)
	}
}

func TestValidObjectForProjectAccessClusterRoles(t *testing.T) {
	projectAccess, err := validateProjectAccessClusterRolesJSON("[ \"View\", \"Edit\", \"Admin\" ]")
	if err != nil {
		t.Error("Unexpected error when parsing data.", err)
	}
	if projectAccess == nil {
		t.Errorf("Unexpected value: actual %v, expected array of strings", projectAccess)
	}
	if len(projectAccess) != 3 {
		t.Errorf("Unexpected value: actual %v, expected %v", len(projectAccess), 3)
	}
}

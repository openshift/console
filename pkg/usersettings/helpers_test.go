package usersettings

import (
	"errors"
	"reflect"
	"testing"
)

func TestNewUserSettingsMeta(t *testing.T) {
	tests := []struct {
		testcase      string
		username      string
		uid           string
		mergedFile    string
		expectedError error
		expectedData  *UserSettingMeta
	}{
		{
			testcase:      "returns -kubeadmin for kube:admin",
			username:      "kube:admin",
			uid:           "",
			expectedError: nil,
			expectedData: &UserSettingMeta{
				Username:           "kube:admin",
				UID:                "",
				ResourceIdentifier: "kubeadmin",
			},
		},
		{
			testcase:      "returns -kubeadmin for fake kube:admin with uid",
			username:      "kube:admin",
			uid:           "1234",
			expectedError: nil,
			expectedData: &UserSettingMeta{
				Username:           "kube:admin",
				UID:                "1234",
				ResourceIdentifier: "1234",
			},
		},
		{
			testcase:      "returns uid for non kube:admin users",
			username:      "developer",
			uid:           "1234",
			expectedError: nil,
			expectedData: &UserSettingMeta{
				Username:           "developer",
				UID:                "1234",
				ResourceIdentifier: "1234",
			},
		},
		{
			testcase:      "returns error for non kube:admin users without uid",
			username:      "developer",
			uid:           "",
			expectedError: errors.New("User must have UID to get required resource data for user-settings"),
			expectedData:  nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.testcase, func(t *testing.T) {
			data, err := newUserSettingMeta(tt.username, tt.uid)
			if !reflect.DeepEqual(tt.expectedError, err) {
				t.Errorf("Error does not match expectation:\n%v\nbut got\n%v", tt.expectedError, err)
			}
			if !reflect.DeepEqual(tt.expectedData, data) {
				t.Errorf("Content does not match expectation:\n%v\nbut got\n%v", tt.expectedData, data)
			}
		})
	}
}

func TestCreateUserSettingsResources(t *testing.T) {
	tests := []struct {
		testcase                string
		username                string
		uid                     string
		expectedRoleName        string
		expectedRoleBindingName string
		expectedConfigMapName   string
	}{
		{
			testcase:                "for kubeadmin",
			username:                "kube:admin",
			uid:                     "",
			expectedConfigMapName:   "user-settings-kubeadmin",
			expectedRoleName:        "user-settings-kubeadmin-role",
			expectedRoleBindingName: "user-settings-kubeadmin-rolebinding",
		},
		{
			testcase:                "for fake kubeadmin we use uid",
			username:                "kube:admin",
			uid:                     "1234",
			expectedConfigMapName:   "user-settings-1234",
			expectedRoleName:        "user-settings-1234-role",
			expectedRoleBindingName: "user-settings-1234-rolebinding",
		},
		{
			testcase:                "for non kubeadmin",
			username:                "developer",
			uid:                     "1234",
			expectedConfigMapName:   "user-settings-1234",
			expectedRoleName:        "user-settings-1234-role",
			expectedRoleBindingName: "user-settings-1234-rolebinding",
		},
	}

	for _, tt := range tests {
		t.Run(tt.testcase, func(t *testing.T) {
			userSettingMeta, err := newUserSettingMeta(tt.username, tt.uid)
			if err != nil {
				t.Error(err)
			}

			role := createRole(userSettingMeta)
			roleBinding := createRoleBinding(userSettingMeta)
			configMap := createConfigMap(userSettingMeta)

			// Role
			if role.ObjectMeta.Name != tt.expectedRoleName {
				t.Errorf("Role name does not match:\n%v\nbut got\n%v", tt.expectedRoleName, role.ObjectMeta.Name)
			}
			if role.Rules[0].ResourceNames[0] != tt.expectedConfigMapName {
				t.Errorf("Role configmap ref does not match:\n%v\nbut got\n%v", tt.expectedConfigMapName, role.Rules[0].ResourceNames[0])
			}

			// RoleBinding
			if roleBinding.ObjectMeta.Name != tt.expectedRoleBindingName {
				t.Errorf("RoleBinding name does not match:\n%v\nbut got\n%v", tt.expectedRoleBindingName, roleBinding.ObjectMeta.Name)
			}
			if roleBinding.Subjects[0].Name != tt.username {
				t.Errorf("RoleBinding username ref does not match:\n%v\nbut got\n%v", tt.username, roleBinding.Subjects[0].Name)
			}
			if roleBinding.RoleRef.Name != tt.expectedRoleName {
				t.Errorf("RoleBinding role ref does not match:\n%v\nbut got\n%v", tt.expectedRoleName, roleBinding.RoleRef.Name)
			}

			// ConfigMap
			if configMap.ObjectMeta.Name != tt.expectedConfigMapName {
				t.Errorf("ConfigMap name does not match:\n%v\nbut got\n%v", tt.expectedConfigMapName, configMap.ObjectMeta.Name)
			}
		})
	}
}

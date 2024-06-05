package usersettings

import (
	"reflect"
	"testing"

	authenticationv1 "k8s.io/api/authentication/v1"
)

func TestNewUserSettingsMeta(t *testing.T) {
	tests := []struct {
		testcase      string
		userInfo      authenticationv1.UserInfo
		expectedError error
		expectedData  *UserSettingMeta
	}{
		{
			testcase: "returns -kubeadmin for kube:admin",
			userInfo: authenticationv1.UserInfo{
				Username: "kube:admin",
				UID:      "",
			},
			expectedError: nil,
			expectedData: &UserSettingMeta{
				Username:           "kube:admin",
				UID:                "",
				ResourceIdentifier: "kubeadmin",
			},
		},
		{
			testcase: "returns -kubeadmin for fake kube:admin with uid",
			userInfo: authenticationv1.UserInfo{
				Username: "kube:admin",
				UID:      "1234",
			},
			expectedError: nil,
			expectedData: &UserSettingMeta{
				Username:           "kube:admin",
				UID:                "1234",
				ResourceIdentifier: "1234",
			},
		},
		{
			testcase: "returns uid for non kube:admin users",
			userInfo: authenticationv1.UserInfo{
				Username: "developer",
				UID:      "1234",
			},
			expectedError: nil,
			expectedData: &UserSettingMeta{
				Username:           "developer",
				UID:                "1234",
				ResourceIdentifier: "1234",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.testcase, func(t *testing.T) {
			data, err := newUserSettingMeta(tt.userInfo)
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
		userInfo                authenticationv1.UserInfo
		expectedRoleName        string
		expectedRoleBindingName string
		expectedConfigMapName   string
	}{
		{
			testcase: "for kubeadmin",
			userInfo: authenticationv1.UserInfo{
				Username: "kube:admin",
				UID:      "",
			},
			expectedConfigMapName:   "user-settings-kubeadmin",
			expectedRoleName:        "user-settings-kubeadmin-role",
			expectedRoleBindingName: "user-settings-kubeadmin-rolebinding",
		},
		{
			testcase: "for fake kubeadmin we use uid",
			userInfo: authenticationv1.UserInfo{
				Username: "kube:admin",
				UID:      "1234",
			},
			expectedConfigMapName:   "user-settings-1234",
			expectedRoleName:        "user-settings-1234-role",
			expectedRoleBindingName: "user-settings-1234-rolebinding",
		},
		{
			testcase: "for non kubeadmin",
			userInfo: authenticationv1.UserInfo{
				Username: "developer",
				UID:      "1234",
			},
			expectedConfigMapName:   "user-settings-1234",
			expectedRoleName:        "user-settings-1234-role",
			expectedRoleBindingName: "user-settings-1234-rolebinding",
		},
	}

	for _, tt := range tests {
		t.Run(tt.testcase, func(t *testing.T) {
			userSettingMeta, err := newUserSettingMeta(tt.userInfo)
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
			if roleBinding.Subjects[0].Name != tt.userInfo.Username {
				t.Errorf("RoleBinding username ref does not match:\n%v\nbut got\n%v", tt.userInfo.Username, roleBinding.Subjects[0].Name)
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

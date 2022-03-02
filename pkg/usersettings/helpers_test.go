package usersettings

import (
	"errors"
	"reflect"
	"testing"

	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func TestNewUserSettingsMeta(t *testing.T) {
	tests := []struct {
		testcase      string
		userInfo      *unstructured.Unstructured
		expectedError error
		expectedData  *UserSettingMeta
	}{
		{
			testcase: "returns -kubeadmin for kube:admin",
			userInfo: &unstructured.Unstructured{
				Object: map[string]interface{}{
					"apiVersion": "user.openshift.io/v1",
					"kind":       "User",
					"metadata": map[string]interface{}{
						"name": "kube:admin",
						"uid":  "",
					},
				},
			},
			expectedError: nil,
			expectedData: &UserSettingMeta{
				Username:           "kube:admin",
				UID:                "",
				ResourceIdentifier: "kubeadmin",
				OwnerReferences:    []meta.OwnerReference{},
			},
		},
		{
			testcase: "returns -kubeadmin for fake kube:admin with uid",
			userInfo: &unstructured.Unstructured{
				Object: map[string]interface{}{
					"apiVersion": "user.openshift.io/v1",
					"kind":       "User",
					"metadata": map[string]interface{}{
						"name": "kube:admin",
						"uid":  "1234",
					},
				},
			},
			expectedError: nil,
			expectedData: &UserSettingMeta{
				Username:           "kube:admin",
				UID:                "1234",
				ResourceIdentifier: "1234",
				OwnerReferences: []meta.OwnerReference{
					meta.OwnerReference{
						APIVersion: "user.openshift.io/v1",
						Kind:       "User",
						Name:       "kube:admin",
						UID:        "1234",
					},
				},
			},
		},
		{
			testcase: "returns uid for non kube:admin users",
			userInfo: &unstructured.Unstructured{
				Object: map[string]interface{}{
					"apiVersion": "user.openshift.io/v1",
					"kind":       "User",
					"metadata": map[string]interface{}{
						"name": "developer",
						"uid":  "1234",
					},
				},
			},
			expectedError: nil,
			expectedData: &UserSettingMeta{
				Username:           "developer",
				UID:                "1234",
				ResourceIdentifier: "1234",
				OwnerReferences: []meta.OwnerReference{
					meta.OwnerReference{
						APIVersion: "user.openshift.io/v1",
						Kind:       "User",
						Name:       "developer",
						UID:        "1234",
					},
				},
			},
		},
		{
			testcase: "returns error for non kube:admin users without uid",
			userInfo: &unstructured.Unstructured{
				Object: map[string]interface{}{
					"apiVersion": "user.openshift.io/v1",
					"kind":       "User",
					"metadata": map[string]interface{}{
						"name": "developer",
						"uid":  "",
					},
				},
			},
			expectedError: errors.New("User must have UID to get required resource data for user-settings"),
			expectedData:  nil,
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
		userInfo                *unstructured.Unstructured
		expectedRoleName        string
		expectedRoleBindingName string
		expectedConfigMapName   string
	}{
		{
			testcase: "for kubeadmin",
			userInfo: &unstructured.Unstructured{
				Object: map[string]interface{}{
					"apiVersion": "user.openshift.io/v1",
					"kind":       "User",
					"metadata": map[string]interface{}{
						"name": "kube:admin",
						"uid":  "",
					},
				},
			},
			expectedConfigMapName:   "user-settings-kubeadmin",
			expectedRoleName:        "user-settings-kubeadmin-role",
			expectedRoleBindingName: "user-settings-kubeadmin-rolebinding",
		},
		{
			testcase: "for fake kubeadmin we use uid",
			userInfo: &unstructured.Unstructured{
				Object: map[string]interface{}{
					"apiVersion": "user.openshift.io/v1",
					"kind":       "User",
					"metadata": map[string]interface{}{
						"name": "kube:admin",
						"uid":  "1234",
					},
				},
			},
			expectedConfigMapName:   "user-settings-1234",
			expectedRoleName:        "user-settings-1234-role",
			expectedRoleBindingName: "user-settings-1234-rolebinding",
		},
		{
			testcase: "for non kubeadmin",
			userInfo: &unstructured.Unstructured{
				Object: map[string]interface{}{
					"apiVersion": "user.openshift.io/v1",
					"kind":       "User",
					"metadata": map[string]interface{}{
						"name": "developer",
						"uid":  "1234",
					},
				},
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
			if roleBinding.Subjects[0].Name != tt.userInfo.GetName() {
				t.Errorf("RoleBinding username ref does not match:\n%v\nbut got\n%v", tt.userInfo.GetName(), roleBinding.Subjects[0].Name)
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

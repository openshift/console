package usersettings

import (
	"reflect"
	"testing"

	authenticationv1 "k8s.io/api/authentication/v1"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestNewUserSettingsMeta(t *testing.T) {
	tests := []struct {
		testcase      string
		userInfo      authenticationv1.UserInfo
		expectedError error
		expectedData  *UserSettingMeta
	}{
		{
			testcase: "returns kubeadmin for kube:admin without uid",
			userInfo: authenticationv1.UserInfo{
				Username: "kube:admin",
				UID:      "",
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
			testcase: "returns SHA256 hash for kube:admin with uid (fake kubeadmin)",
			userInfo: authenticationv1.UserInfo{
				Username: "kube:admin",
				UID:      "1234",
			},
			expectedError: nil,
			expectedData: &UserSettingMeta{
				Username:           "kube:admin",
				UID:                "1234",
				ResourceIdentifier: "547a4b6a78942df67733f5a36aaf80a9f81605e51928d23108ee623042b2a065",
				OwnerReferences: []meta.OwnerReference{
					{
						APIVersion: "user.openshift.io/v1",
						Kind:       "User",
						Name:       "kube:admin",
						UID:        "1234",
					},
				},
			},
		},
		{
			testcase: "returns SHA256 hash of username for non kube:admin users",
			userInfo: authenticationv1.UserInfo{
				Username: "developer",
				UID:      "1234",
			},
			expectedError: nil,
			expectedData: &UserSettingMeta{
				Username:           "developer",
				UID:                "1234",
				ResourceIdentifier: "88fa0d759f845b47c044c2cd44e29082cf6fea665c30c146374ec7c8f3d699e3",
				OwnerReferences: []meta.OwnerReference{
					{
						APIVersion: "user.openshift.io/v1",
						Kind:       "User",
						Name:       "developer",
						UID:        "1234",
					},
				},
			},
		},
		{
			testcase: "same username with different UIDs produces same ResourceIdentifier",
			userInfo: authenticationv1.UserInfo{
				Username: "developer",
				UID:      "different-uid-5678",
			},
			expectedError: nil,
			expectedData: &UserSettingMeta{
				Username:           "developer",
				UID:                "different-uid-5678",
				ResourceIdentifier: "88fa0d759f845b47c044c2cd44e29082cf6fea665c30c146374ec7c8f3d699e3",
				OwnerReferences: []meta.OwnerReference{
					{
						APIVersion: "user.openshift.io/v1",
						Kind:       "User",
						Name:       "developer",
						UID:        "different-uid-5678",
					},
				},
			},
		},
		{
			testcase: "username with special characters produces valid hash",
			userInfo: authenticationv1.UserInfo{
				Username: "user@example.com",
				UID:      "uid-99",
			},
			expectedError: nil,
			expectedData: &UserSettingMeta{
				Username:           "user@example.com",
				UID:                "uid-99",
				ResourceIdentifier: "b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514",
				OwnerReferences: []meta.OwnerReference{
					{
						APIVersion: "user.openshift.io/v1",
						Kind:       "User",
						Name:       "user@example.com",
						UID:        "uid-99",
					},
				},
			},
		},
		{
			testcase: "user without uid gets empty OwnerReferences",
			userInfo: authenticationv1.UserInfo{
				Username: "developer",
				UID:      "",
			},
			expectedError: nil,
			expectedData: &UserSettingMeta{
				Username:           "developer",
				UID:                "",
				ResourceIdentifier: "88fa0d759f845b47c044c2cd44e29082cf6fea665c30c146374ec7c8f3d699e3",
				OwnerReferences:    []meta.OwnerReference{},
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
			testcase: "for kubeadmin without uid",
			userInfo: authenticationv1.UserInfo{
				Username: "kube:admin",
				UID:      "",
			},
			expectedConfigMapName:   "user-settings-kubeadmin",
			expectedRoleName:        "user-settings-kubeadmin-role",
			expectedRoleBindingName: "user-settings-kubeadmin-rolebinding",
		},
		{
			testcase: "for fake kubeadmin we use SHA256 hash",
			userInfo: authenticationv1.UserInfo{
				Username: "kube:admin",
				UID:      "1234",
			},
			expectedConfigMapName:   "user-settings-547a4b6a78942df67733f5a36aaf80a9f81605e51928d23108ee623042b2a065",
			expectedRoleName:        "user-settings-547a4b6a78942df67733f5a36aaf80a9f81605e51928d23108ee623042b2a065-role",
			expectedRoleBindingName: "user-settings-547a4b6a78942df67733f5a36aaf80a9f81605e51928d23108ee623042b2a065-rolebinding",
		},
		{
			testcase: "for non kubeadmin we use SHA256 hash",
			userInfo: authenticationv1.UserInfo{
				Username: "developer",
				UID:      "1234",
			},
			expectedConfigMapName:   "user-settings-88fa0d759f845b47c044c2cd44e29082cf6fea665c30c146374ec7c8f3d699e3",
			expectedRoleName:        "user-settings-88fa0d759f845b47c044c2cd44e29082cf6fea665c30c146374ec7c8f3d699e3-role",
			expectedRoleBindingName: "user-settings-88fa0d759f845b47c044c2cd44e29082cf6fea665c30c146374ec7c8f3d699e3-rolebinding",
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

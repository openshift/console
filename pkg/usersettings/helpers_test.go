package usersettings

import (
	"reflect"
	"testing"

	authenticationv1 "k8s.io/api/authentication/v1"
	core "k8s.io/api/core/v1"
	rbac "k8s.io/api/rbac/v1"
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
		testcase            string
		userInfo            authenticationv1.UserInfo
		expectedRole        rbac.Role
		expectedRoleBinding rbac.RoleBinding
		expectedConfigMap   core.ConfigMap
	}{
		{
			testcase: "for kubeadmin",
			userInfo: authenticationv1.UserInfo{
				Username: "kube:admin",
				UID:      "",
			},
			expectedRole: rbac.Role{
				TypeMeta: meta.TypeMeta{
					APIVersion: "rbac.authorization.k8s.io/v1",
					Kind:       "Role",
				},
				ObjectMeta: meta.ObjectMeta{
					Name: "user-settings-kubeadmin-role",
					Labels: map[string]string{
						userSettingsLabel:       "true",
						uidLabel:                "",
						resourceIdentifierLabel: "kubeadmin",
					},
					Annotations: map[string]string{
						uidAnnotation:      "",
						usernameAnnotation: "kube:admin",
					},
				},
				Rules: []rbac.PolicyRule{
					{
						APIGroups: []string{
							"", // Core group, not "v1"
						},
						Resources: []string{
							"configmaps", // Not "ConfigMap"
						},
						Verbs: []string{
							"get",
							"list",
							"patch",
							"update",
							"watch",
						},
						ResourceNames: []string{
							"user-settings-kubeadmin",
						},
					},
				},
			},
			expectedRoleBinding: rbac.RoleBinding{
				TypeMeta: meta.TypeMeta{
					APIVersion: "rbac.authorization.k8s.io/v1",
					Kind:       "RoleBinding",
				},
				ObjectMeta: meta.ObjectMeta{
					Name: "user-settings-kubeadmin-rolebinding",
					Labels: map[string]string{
						userSettingsLabel:       "true",
						uidLabel:                "",
						resourceIdentifierLabel: "kubeadmin",
					},
					Annotations: map[string]string{
						uidAnnotation:      "",
						usernameAnnotation: "kube:admin",
					},
				},
				Subjects: []rbac.Subject{
					{
						APIGroup: "rbac.authorization.k8s.io",
						Kind:     "User",
						Name:     "kube:admin",
					},
				},
				RoleRef: rbac.RoleRef{
					APIGroup: "rbac.authorization.k8s.io",
					Kind:     "Role",
					Name:     "user-settings-kubeadmin-role",
				},
			},
			expectedConfigMap: core.ConfigMap{
				TypeMeta: meta.TypeMeta{
					APIVersion: "v1",
					Kind:       "ConfigMap",
				},
				ObjectMeta: meta.ObjectMeta{
					Name: "user-settings-kubeadmin",
					Labels: map[string]string{
						userSettingsLabel:       "true",
						uidLabel:                "",
						resourceIdentifierLabel: "kubeadmin",
					},
					Annotations: map[string]string{
						uidAnnotation:      "",
						usernameAnnotation: "kube:admin",
					},
				},
			},
		},
		{
			testcase: "for fake kubeadmin we use uid",
			userInfo: authenticationv1.UserInfo{
				Username: "kube:admin",
				UID:      "1234",
			},
			expectedRole: rbac.Role{
				TypeMeta: meta.TypeMeta{
					APIVersion: "rbac.authorization.k8s.io/v1",
					Kind:       "Role",
				},
				ObjectMeta: meta.ObjectMeta{
					Name: "user-settings-1234-role",
					Labels: map[string]string{
						userSettingsLabel:       "true",
						uidLabel:                "1234",
						resourceIdentifierLabel: "1234",
					},
					Annotations: map[string]string{
						uidAnnotation:      "1234",
						usernameAnnotation: "kube:admin",
					},
				},
				Rules: []rbac.PolicyRule{
					{
						APIGroups: []string{
							"", // Core group, not "v1"
						},
						Resources: []string{
							"configmaps", // Not "ConfigMap"
						},
						Verbs: []string{
							"get",
							"list",
							"patch",
							"update",
							"watch",
						},
						ResourceNames: []string{
							"user-settings-1234",
						},
					},
				},
			},
			expectedRoleBinding: rbac.RoleBinding{
				TypeMeta: meta.TypeMeta{
					APIVersion: "rbac.authorization.k8s.io/v1",
					Kind:       "RoleBinding",
				},
				ObjectMeta: meta.ObjectMeta{
					Name: "user-settings-1234-rolebinding",
					Labels: map[string]string{
						userSettingsLabel:       "true",
						uidLabel:                "1234",
						resourceIdentifierLabel: "1234",
					},
					Annotations: map[string]string{
						uidAnnotation:      "1234",
						usernameAnnotation: "kube:admin",
					},
				},
				Subjects: []rbac.Subject{
					{
						APIGroup: "rbac.authorization.k8s.io",
						Kind:     "User",
						Name:     "kube:admin",
					},
				},
				RoleRef: rbac.RoleRef{
					APIGroup: "rbac.authorization.k8s.io",
					Kind:     "Role",
					Name:     "user-settings-1234-role",
				},
			},
			expectedConfigMap: core.ConfigMap{
				TypeMeta: meta.TypeMeta{
					APIVersion: "v1",
					Kind:       "ConfigMap",
				},
				ObjectMeta: meta.ObjectMeta{
					Name: "user-settings-1234",
					Labels: map[string]string{
						userSettingsLabel:       "true",
						uidLabel:                "1234",
						resourceIdentifierLabel: "1234",
					},
					Annotations: map[string]string{
						uidAnnotation:      "1234",
						usernameAnnotation: "kube:admin",
					},
				},
			},
		},
		{
			testcase: "for non kubeadmin",
			userInfo: authenticationv1.UserInfo{
				Username: "developer",
				UID:      "1234",
			},
			expectedRole: rbac.Role{
				TypeMeta: meta.TypeMeta{
					APIVersion: "rbac.authorization.k8s.io/v1",
					Kind:       "Role",
				},
				ObjectMeta: meta.ObjectMeta{
					Name: "user-settings-1234-role",
					Labels: map[string]string{
						userSettingsLabel:       "true",
						uidLabel:                "1234",
						resourceIdentifierLabel: "1234",
					},
					Annotations: map[string]string{
						uidAnnotation:      "1234",
						usernameAnnotation: "developer",
					},
				},
				Rules: []rbac.PolicyRule{
					{
						APIGroups: []string{
							"", // Core group, not "v1"
						},
						Resources: []string{
							"configmaps", // Not "ConfigMap"
						},
						Verbs: []string{
							"get",
							"list",
							"patch",
							"update",
							"watch",
						},
						ResourceNames: []string{
							"user-settings-1234",
						},
					},
				},
			},
			expectedRoleBinding: rbac.RoleBinding{
				TypeMeta: meta.TypeMeta{
					APIVersion: "rbac.authorization.k8s.io/v1",
					Kind:       "RoleBinding",
				},
				ObjectMeta: meta.ObjectMeta{
					Name: "user-settings-1234-rolebinding",
					Labels: map[string]string{
						userSettingsLabel:       "true",
						uidLabel:                "1234",
						resourceIdentifierLabel: "1234",
					},
					Annotations: map[string]string{
						uidAnnotation:      "1234",
						usernameAnnotation: "developer",
					},
				},
				Subjects: []rbac.Subject{
					{
						APIGroup: "rbac.authorization.k8s.io",
						Kind:     "User",
						Name:     "developer",
					},
				},
				RoleRef: rbac.RoleRef{
					APIGroup: "rbac.authorization.k8s.io",
					Kind:     "Role",
					Name:     "user-settings-1234-role",
				},
			},
			expectedConfigMap: core.ConfigMap{
				TypeMeta: meta.TypeMeta{
					APIVersion: "v1",
					Kind:       "ConfigMap",
				},
				ObjectMeta: meta.ObjectMeta{
					Name: "user-settings-1234",
					Labels: map[string]string{
						userSettingsLabel:       "true",
						uidLabel:                "1234",
						resourceIdentifierLabel: "1234",
					},
					Annotations: map[string]string{
						uidAnnotation:      "1234",
						usernameAnnotation: "developer",
					},
				},
			},
		},
		{
			testcase: "for users with email addresses as username",
			userInfo: authenticationv1.UserInfo{
				Username: "openshift@redhat.com",
			},
			expectedRole: rbac.Role{
				TypeMeta: meta.TypeMeta{
					APIVersion: "rbac.authorization.k8s.io/v1",
					Kind:       "Role",
				},
				ObjectMeta: meta.ObjectMeta{
					Name: "user-settings-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855-role",
					Labels: map[string]string{
						userSettingsLabel:       "true",
						uidLabel:                "",
						resourceIdentifierLabel: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
					},
					Annotations: map[string]string{
						uidAnnotation:      "",
						usernameAnnotation: "openshift@redhat.com",
					},
				},
				Rules: []rbac.PolicyRule{
					{
						APIGroups: []string{
							"", // Core group, not "v1"
						},
						Resources: []string{
							"configmaps", // Not "ConfigMap"
						},
						Verbs: []string{
							"get",
							"list",
							"patch",
							"update",
							"watch",
						},
						ResourceNames: []string{
							"user-settings-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
						},
					},
				},
			},
			expectedRoleBinding: rbac.RoleBinding{
				TypeMeta: meta.TypeMeta{
					APIVersion: "rbac.authorization.k8s.io/v1",
					Kind:       "RoleBinding",
				},
				ObjectMeta: meta.ObjectMeta{
					Name: "user-settings-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855-rolebinding",
					Labels: map[string]string{
						userSettingsLabel:       "true",
						uidLabel:                "",
						resourceIdentifierLabel: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
					},
					Annotations: map[string]string{
						uidAnnotation:      "",
						usernameAnnotation: "openshift@redhat.com",
					},
				},
				Subjects: []rbac.Subject{
					{
						APIGroup: "rbac.authorization.k8s.io",
						Kind:     "User",
						Name:     "openshift@redhat.com",
					},
				},
				RoleRef: rbac.RoleRef{
					APIGroup: "rbac.authorization.k8s.io",
					Kind:     "Role",
					Name:     "user-settings-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855-role",
				},
			},
			expectedConfigMap: core.ConfigMap{
				TypeMeta: meta.TypeMeta{
					APIVersion: "v1",
					Kind:       "ConfigMap",
				},
				ObjectMeta: meta.ObjectMeta{
					Name: "user-settings-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
					Labels: map[string]string{
						userSettingsLabel:       "true",
						uidLabel:                "",
						resourceIdentifierLabel: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
					},
					Annotations: map[string]string{
						uidAnnotation:      "",
						usernameAnnotation: "openshift@redhat.com",
					},
				},
			},
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

			if !reflect.DeepEqual(&tt.expectedRole, role) {
				t.Errorf("Role does not match expectation:\n%v\nbut got\n%v", &tt.expectedRole, role)
			}
			if !reflect.DeepEqual(&tt.expectedRoleBinding, roleBinding) {
				t.Errorf("RoleBinding does not match expectation:\n%v\nbut got\n%v", &tt.expectedRoleBinding, roleBinding)
			}
			if !reflect.DeepEqual(&tt.expectedConfigMap, configMap) {
				t.Errorf("ConfigMap does not match expectation:\n%v\nbut got\n%v", &tt.expectedConfigMap, configMap)
			}
		})
	}
}

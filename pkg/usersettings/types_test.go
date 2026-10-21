package usersettings

import (
	"testing"
)

func TestUserSettingMetaNameHelpers(t *testing.T) {
	tests := []struct {
		testcase                string
		userSettingMeta         UserSettingMeta
		expectedConfigMapName   string
		expectedRoleName        string
		expectedRoleBindingName string
	}{
		{
			testcase: "for kubeadmin",
			userSettingMeta: UserSettingMeta{
				Username:           "kube:admin",
				UID:                "",
				ResourceIdentifier: "kubeadmin",
			},
			expectedConfigMapName:   "user-settings-kubeadmin",
			expectedRoleName:        "user-settings-kubeadmin-role",
			expectedRoleBindingName: "user-settings-kubeadmin-rolebinding",
		},
		{
			testcase: "for non kubeadmin",
			userSettingMeta: UserSettingMeta{
				Username:           "developer",
				UID:                "1234",
				ResourceIdentifier: "1234",
			},
			expectedConfigMapName:   "user-settings-1234",
			expectedRoleName:        "user-settings-1234-role",
			expectedRoleBindingName: "user-settings-1234-rolebinding",
		},
	}

	for _, tt := range tests {
		t.Run(tt.testcase, func(t *testing.T) {
			got := tt.userSettingMeta.getConfigMapName()
			if got != tt.expectedConfigMapName {
				t.Errorf("ConfigMap name does not match:\n%v\nbut got\n%v", tt.expectedConfigMapName, got)
			}
			got = tt.userSettingMeta.getRoleName()
			if got != tt.expectedRoleName {
				t.Errorf("Role name does not match:\n%v\nbut got\n%v", tt.expectedRoleName, got)
			}
			got = tt.userSettingMeta.getRoleBindingName()
			if got != tt.expectedRoleBindingName {
				t.Errorf("RoleBinding name does not match:\n%v\nbut got\n%v", tt.expectedRoleBindingName, got)
			}
		})
	}
}

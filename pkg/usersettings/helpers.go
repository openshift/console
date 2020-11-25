package usersettings

import (
	"errors"

	core "k8s.io/api/core/v1"
	rbac "k8s.io/api/rbac/v1"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func newUserSettingMeta(name string, uid string) (*UserSettingMeta, error) {
	resourceIdentifier := ""

	if uid != "" {
		resourceIdentifier = uid
	} else if name == "kube:admin" {
		resourceIdentifier = "kubeadmin"
	} else {
		return nil, errors.New("User must have UID to get required resource data for user-settings")
	}

	return &UserSettingMeta{
		Username:           name,
		UID:                uid,
		ResourceIdentifier: resourceIdentifier,
	}, nil
}

func createRole(userSettingMeta *UserSettingMeta) *rbac.Role {
	return &rbac.Role{
		TypeMeta: meta.TypeMeta{
			APIVersion: "rbac.authorization.k8s.io/v1",
			Kind:       "Role",
		},
		ObjectMeta: meta.ObjectMeta{
			Name: userSettingMeta.getRoleName(),
		},
		Rules: []rbac.PolicyRule{
			rbac.PolicyRule{
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
					userSettingMeta.getConfigMapName(),
				},
			},
		},
	}
}

func createRoleBinding(userSettingMeta *UserSettingMeta) *rbac.RoleBinding {
	return &rbac.RoleBinding{
		TypeMeta: meta.TypeMeta{
			APIVersion: "rbac.authorization.k8s.io/v1",
			Kind:       "RoleBinding",
		},
		ObjectMeta: meta.ObjectMeta{
			Name: userSettingMeta.getRoleBindingName(),
		},
		Subjects: []rbac.Subject{
			rbac.Subject{
				APIGroup: "rbac.authorization.k8s.io",
				Kind:     "User",
				Name:     userSettingMeta.Username,
			},
		},
		RoleRef: rbac.RoleRef{
			APIGroup: "rbac.authorization.k8s.io",
			Kind:     "Role",
			Name:     userSettingMeta.getRoleName(),
		},
	}
}

func createConfigMap(userSettingMeta *UserSettingMeta) *core.ConfigMap {
	return &core.ConfigMap{
		TypeMeta: meta.TypeMeta{
			APIVersion: "v1",
			Kind:       "ConfigMap",
		},
		ObjectMeta: meta.ObjectMeta{
			Name: userSettingMeta.getConfigMapName(),
		},
	}
}

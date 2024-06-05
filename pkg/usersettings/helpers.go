package usersettings

import (
	"crypto/sha256"
	"encoding/hex"

	authenticationv1 "k8s.io/api/authentication/v1"
	core "k8s.io/api/core/v1"
	rbac "k8s.io/api/rbac/v1"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func newUserSettingMeta(userInfo authenticationv1.UserInfo) (*UserSettingMeta, error) {
	uid := userInfo.UID
	name := userInfo.Username
	resourceIdentifier := name

	if uid != "" {
		resourceIdentifier = string(uid)
	} else if name == "kube:admin" {
		resourceIdentifier = "kubeadmin"
	} else {
		// to avoid issues when the username contains special characters like '@'
		// that are not allowed in kube resource names
		// we also can't use base64 encoding because only lowercase chars are allowed
		// in CM names
		sha256Hash := sha256.New()
		sha256Hash.Write([]byte(resourceIdentifier))
		resourceIdentifier = hex.EncodeToString(sha256Hash.Sum(nil))
	}

	return &UserSettingMeta{
		Username:           name,
		UID:                string(uid),
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
			{
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

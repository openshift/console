package usersettings

import (
	"crypto/sha256"
	"encoding/hex"

	authenticationv1 "k8s.io/api/authentication/v1"
	core "k8s.io/api/core/v1"
	rbac "k8s.io/api/rbac/v1"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

func newUserSettingMeta(userInfo authenticationv1.UserInfo) (*UserSettingMeta, error) {
	uid := userInfo.UID
	name := userInfo.Username

	var resourceIdentifier string
	ownerReferences := []meta.OwnerReference{}

	if name == "kube:admin" && uid == "" {
		resourceIdentifier = "kubeadmin"
	} else {
		sum := sha256.Sum256([]byte(name))
		resourceIdentifier = hex.EncodeToString(sum[:])

		if uid != "" {
			ownerReferences = []meta.OwnerReference{
				{
					APIVersion: "user.openshift.io/v1",
					Kind:       "User",
					Name:       name,
					UID:        types.UID(uid),
				},
			}
		}
	}

	return &UserSettingMeta{
		Username:           name,
		UID:                string(uid),
		ResourceIdentifier: resourceIdentifier,
		OwnerReferences:    ownerReferences,
	}, nil
}

func createRole(userSettingMeta *UserSettingMeta) *rbac.Role {
	return &rbac.Role{
		TypeMeta: meta.TypeMeta{
			APIVersion: "rbac.authorization.k8s.io/v1",
			Kind:       "Role",
		},
		ObjectMeta: meta.ObjectMeta{
			Name:            userSettingMeta.getRoleName(),
			OwnerReferences: userSettingMeta.OwnerReferences,
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
			Name:            userSettingMeta.getRoleBindingName(),
			OwnerReferences: userSettingMeta.OwnerReferences,
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
			Name:            userSettingMeta.getConfigMapName(),
			OwnerReferences: userSettingMeta.OwnerReferences,
		},
	}
}

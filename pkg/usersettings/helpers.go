package usersettings

import (
	authenticationv1 "k8s.io/api/authentication/v1"
	core "k8s.io/api/core/v1"
	rbac "k8s.io/api/rbac/v1"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

func newUserSettingMeta(userInfo authenticationv1.UserInfo) (*UserSettingMeta, error) {
	uid := userInfo.UID
	name := userInfo.Username
	resourceIdentifier := ""
	var ownerReferences []meta.OwnerReference

	if uid != "" {
		resourceIdentifier = string(uid)
		ownerReferences = []meta.OwnerReference{
			{
				APIVersion: "user.openshift.io/v1", // TODO: is this necessary? What does it do?
				Kind:       "User",                 // TODO: is this necessary? What does it do?
				Name:       name,
				UID:        types.UID(uid),
			},
		}
	} else if name == "kube:admin" {
		resourceIdentifier = "kubeadmin"
		ownerReferences = []meta.OwnerReference{}
	} //else {
	// FIXME: The legacy OIDC config won't pass UIDs, which is a k8s design flaw. We may need to parse the token to get its sub claim.
	//return nil, errors.New("User must have UID to get required resource data for user-settings")
	//}

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

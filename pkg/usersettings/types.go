package usersettings

import (
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type UserSettingMeta struct {
	Username string
	UID      string
	// ResourceIdentifier contains "kubeadmin" for the real kubeadmin (no UID)
	// and SHA256(username) as hex for all other users.
	ResourceIdentifier string
	OwnerReferences    []meta.OwnerReference
}

func (r *UserSettingMeta) getConfigMapName() string {
	return "user-settings-" + r.ResourceIdentifier
}

func (r *UserSettingMeta) getRoleName() string {
	return "user-settings-" + r.ResourceIdentifier + "-role"
}

func (r *UserSettingMeta) getRoleBindingName() string {
	return "user-settings-" + r.ResourceIdentifier + "-rolebinding"
}

package usersettings

type UserSettingMeta struct {
	Username string
	UID      string
	// The resource identifier contains "kubeadmin" for the kubeadmin and the user uid otherwise.
	ResourceIdentifier string
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

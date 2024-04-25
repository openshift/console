package usersettings

const userSettingsLabel = "console.openshift.io/user-settings"
const uidLabel = "console.openshift.io/user-settings-uid"
const resourceIdentifierLabel = "console.openshift.io/user-settings-resource-identifier"
const uidAnnotation = "console.openshift.io/user-settings-uid"
const usernameAnnotation = "console.openshift.io/user-settings-username"

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

func (r *UserSettingMeta) getLabels() map[string]string {
	return map[string]string{
		userSettingsLabel:       "true",
		uidLabel:                r.UID,
		resourceIdentifierLabel: r.ResourceIdentifier,
	}
}

func (r *UserSettingMeta) getAnnotations() map[string]string {
	return map[string]string{
		uidAnnotation:      r.UID,
		usernameAnnotation: r.Username,
	}
}

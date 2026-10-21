package usersettings

import (
	"context"
	"fmt"
	"net/http"

	authenticationv1 "k8s.io/api/authentication/v1"
	core "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/klog/v2"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/serverutils"
)

const namespace = "openshift-console-user-settings"

type UserSettingsHandler struct {
	internalProxiedClient kubernetes.Interface
	anonClientConfig      *rest.Config
}

func NewUserSettingsHandler(kubeClient kubernetes.Interface, anonymousRoundTripper http.RoundTripper, k8sProxiedEndpoint string) *UserSettingsHandler {
	return &UserSettingsHandler{
		internalProxiedClient: kubeClient,
		anonClientConfig: &rest.Config{
			Host:      k8sProxiedEndpoint,
			Transport: anonymousRoundTripper,
		},
	}
}

func (h *UserSettingsHandler) HandleUserSettings(user *auth.User, w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userSettingMeta, err := h.getUserSettingMeta(ctx, user)
	if err != nil {
		h.sendErrorResponse("Failed to get user data to handle user setting request: %v", err, w)
		return
	}

	switch r.Method {
	case http.MethodGet:
		configMap, err := h.getUserSettings(ctx, userSettingMeta)
		if err != nil {
			h.sendErrorResponse("Failed to get user settings: %v", err, w)
			return
		}
		serverutils.SendResponse(w, http.StatusOK, configMap)
	case http.MethodPost:
		configMap, err := h.createUserSettings(ctx, userSettingMeta)
		if err != nil {
			h.sendErrorResponse("Failed to create user settings: %v", err, w)
			return
		}
		serverutils.SendResponse(w, http.StatusOK, configMap)
	case http.MethodDelete:
		err := h.deleteUserSettings(ctx, userSettingMeta)
		if err != nil {
			h.sendErrorResponse("Failed to delete user settings: %v", err, w)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		w.Header().Set("Allow", "GET, POST, DELETE")
		serverutils.SendResponse(w, http.StatusMethodNotAllowed, serverutils.ApiError{Err: "Unsupported method, supported methods are GET POST DELETE"})
	}
}

func (h *UserSettingsHandler) sendErrorResponse(format string, err error, w http.ResponseWriter) {
	errMsg := fmt.Sprintf(format, err)
	klog.Errorf("%s", errMsg)
	code := http.StatusBadGateway
	if apierrors.IsNotFound(err) {
		code = http.StatusNotFound
	} else if apierrors.IsForbidden(err) {
		code = http.StatusForbidden
	}
	serverutils.SendResponse(w, code, serverutils.ApiError{Err: errMsg})
}

// Fetch the user-setting ConfigMap of the current user
func (h *UserSettingsHandler) getUserSettings(ctx context.Context, userSettingMeta *UserSettingMeta) (*core.ConfigMap, error) {
	return h.internalProxiedClient.CoreV1().ConfigMaps(namespace).Get(ctx, userSettingMeta.getConfigMapName(), meta.GetOptions{})
}

// Create a new user-setting ConfigMap, incl. Role and RoleBinding for the current user.
// Returns the existing ConfigMap immediately if it already exists.
// Migrates data from the most recent old ConfigMap if any exist for this user.
func (h *UserSettingsHandler) createUserSettings(ctx context.Context, userSettingMeta *UserSettingMeta) (*core.ConfigMap, error) {
	existing, err := h.internalProxiedClient.CoreV1().ConfigMaps(namespace).Get(ctx, userSettingMeta.getConfigMapName(), meta.GetOptions{})
	if err == nil {
		return existing, nil
	}
	if !apierrors.IsNotFound(err) {
		return nil, err
	}

	// OCPBUGS-86564: find old UID-based ConfigMaps that were created before
	// the switch to stable SHA256(username) naming.
	oldCMs := h.findOldUserSettingsConfigMaps(ctx, userSettingMeta)

	var migrateFrom *core.ConfigMap
	for i := range oldCMs {
		if migrateFrom == nil || oldCMs[i].CreationTimestamp.After(migrateFrom.CreationTimestamp.Time) {
			migrateFrom = &oldCMs[i]
		}
	}

	configMap := createConfigMap(userSettingMeta)
	if migrateFrom != nil {
		configMap.Data = migrateFrom.Data
	}

	role := createRole(userSettingMeta)
	roleBinding := createRoleBinding(userSettingMeta)

	_, err = h.internalProxiedClient.RbacV1().Roles(namespace).Create(ctx, role, meta.CreateOptions{})
	if err != nil && !apierrors.IsAlreadyExists(err) {
		h.deleteUserSettings(ctx, userSettingMeta)
		return nil, err
	}

	_, err = h.internalProxiedClient.RbacV1().RoleBindings(namespace).Create(ctx, roleBinding, meta.CreateOptions{})
	if err != nil && !apierrors.IsAlreadyExists(err) {
		h.deleteUserSettings(ctx, userSettingMeta)
		return nil, err
	}

	configMap, err = h.internalProxiedClient.CoreV1().ConfigMaps(namespace).Create(ctx, configMap, meta.CreateOptions{})
	if err != nil {
		if apierrors.IsAlreadyExists(err) {
			klog.Infof("User settings ConfigMap %q already exists, will return existing data.", userSettingMeta.getConfigMapName())
			h.cleanupOldUserSettings(ctx, oldCMs)
			return h.internalProxiedClient.CoreV1().ConfigMaps(namespace).Get(ctx, userSettingMeta.getConfigMapName(), meta.GetOptions{})
		}
		h.deleteUserSettings(ctx, userSettingMeta)
		return nil, err
	}

	h.cleanupOldUserSettings(ctx, oldCMs)

	return configMap, nil
}

// findOldUserSettingsConfigMaps lists ConfigMaps in the user-settings namespace
// and returns all that are owned by this user but don't match the current
// naming scheme.
func (h *UserSettingsHandler) findOldUserSettingsConfigMaps(ctx context.Context, userSettingMeta *UserSettingMeta) []core.ConfigMap {
	configMaps, err := h.internalProxiedClient.CoreV1().ConfigMaps(namespace).List(ctx, meta.ListOptions{})
	if err != nil {
		klog.Warningf("Failed to list ConfigMaps for migration: %v", err)
		return nil
	}

	newName := userSettingMeta.getConfigMapName()
	var old []core.ConfigMap
	for _, cm := range configMaps.Items {
		if cm.Name == newName {
			continue
		}
		for _, ref := range cm.OwnerReferences {
			if ref.Kind == "User" && ref.Name == userSettingMeta.Username {
				klog.V(4).Infof("Found old user settings ConfigMap %q for migration to %q.", cm.Name, newName)
				old = append(old, cm)
				break
			}
		}
	}
	return old
}

// cleanupOldUserSettings removes old ConfigMaps and their associated Roles
// and RoleBindings after a successful migration. Errors are best-effort.
func (h *UserSettingsHandler) cleanupOldUserSettings(ctx context.Context, oldCMs []core.ConfigMap) {
	for _, cm := range oldCMs {
		name := cm.Name
		if err := h.internalProxiedClient.RbacV1().RoleBindings(namespace).Delete(ctx, name+"-rolebinding", meta.DeleteOptions{}); err != nil && !apierrors.IsNotFound(err) {
			klog.Warningf("Failed to clean up old user settings RoleBinding %q: %v", name+"-rolebinding", err)
		}
		if err := h.internalProxiedClient.RbacV1().Roles(namespace).Delete(ctx, name+"-role", meta.DeleteOptions{}); err != nil && !apierrors.IsNotFound(err) {
			klog.Warningf("Failed to clean up old user settings Role %q: %v", name+"-role", err)
		}
		if err := h.internalProxiedClient.CoreV1().ConfigMaps(namespace).Delete(ctx, name, meta.DeleteOptions{}); err != nil && !apierrors.IsNotFound(err) {
			klog.Warningf("Failed to clean up old user settings ConfigMap %q: %v", name, err)
		}
		klog.V(4).Infof("Cleaned up old user settings resources (old name: %s).", name)
	}
}

// Deletes the user-setting ConfigMap, Role and RoleBinding of the current user.
// It handles not found responses, so that it does not fail on multiple calls.
func (h *UserSettingsHandler) deleteUserSettings(ctx context.Context, userSettingMeta *UserSettingMeta) error {
	err := h.internalProxiedClient.RbacV1().RoleBindings(namespace).Delete(ctx, userSettingMeta.getRoleBindingName(), meta.DeleteOptions{})
	if err != nil && !apierrors.IsNotFound(err) {
		return err
	}

	err = h.internalProxiedClient.RbacV1().Roles(namespace).Delete(ctx, userSettingMeta.getRoleName(), meta.DeleteOptions{})
	if err != nil && !apierrors.IsNotFound(err) {
		return err
	}

	err = h.internalProxiedClient.CoreV1().ConfigMaps(namespace).Delete(ctx, userSettingMeta.getConfigMapName(), meta.DeleteOptions{})
	if err != nil && !apierrors.IsNotFound(err) {
		return err
	}

	return nil
}

func (h *UserSettingsHandler) getUserSettingMeta(ctx context.Context, user *auth.User) (*UserSettingMeta, error) {
	// copy the anon config for the user and authenticate the transport with the user's token
	userConfig := rest.CopyConfig(h.anonClientConfig)
	userConfig.BearerToken = user.Token

	client, err := kubernetes.NewForConfig(userConfig)
	if err != nil {
		return nil, err
	}

	userInfo, err := client.AuthenticationV1().SelfSubjectReviews().Create(ctx, &authenticationv1.SelfSubjectReview{}, meta.CreateOptions{})
	if err != nil {
		return nil, err
	}

	return newUserSettingMeta(userInfo.Status.UserInfo)
}

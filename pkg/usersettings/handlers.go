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
	"k8s.io/klog"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/serverutils"
)

const namespace = "openshift-console-user-settings"

type UserSettingsHandler struct {
	internalProxiedClient *kubernetes.Clientset
	anonClientConfig      *rest.Config
}

func NewUserSettingsHandler(kubeClient *kubernetes.Clientset, anonymousRoundTripper http.RoundTripper, k8sProxiedEndpoint string) *UserSettingsHandler {
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
	klog.Errorf(errMsg)
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
// Returns the existing ConfigMap if it is already exist.
func (h *UserSettingsHandler) createUserSettings(ctx context.Context, userSettingMeta *UserSettingMeta) (*core.ConfigMap, error) {
	role := createRole(userSettingMeta)
	roleBinding := createRoleBinding(userSettingMeta)
	configMap := createConfigMap(userSettingMeta)

	_, err := h.internalProxiedClient.RbacV1().Roles(namespace).Create(ctx, role, meta.CreateOptions{})
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
		// Return actual ConfigMap if it is already created
		if apierrors.IsAlreadyExists(err) {
			klog.Infof("User settings ConfigMap \"%s\" already exist, will return existing data.", userSettingMeta.getConfigMapName())
			return h.internalProxiedClient.CoreV1().ConfigMaps(namespace).Get(ctx, userSettingMeta.getConfigMapName(), meta.GetOptions{})
		}
		h.deleteUserSettings(ctx, userSettingMeta)
		return nil, err
	}
	return configMap, nil
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

package usersettings

import (
	"context"
	"fmt"
	"net/http"

	core "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/klog"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/serverutils"
)

const namespace = "openshift-console-user-settings"

var USER_RESOURCE = schema.GroupVersionResource{
	Group:    "user.openshift.io",
	Version:  "v1",
	Resource: "users",
}

type UserSettingsHandler struct {
	K8sProxyConfig      *proxy.Config
	Client              *http.Client
	Endpoint            string
	ServiceAccountToken string
}

func (h *UserSettingsHandler) HandleUserSettings(user *auth.User, w http.ResponseWriter, r *http.Request) {
	context := context.TODO()

	serviceAccountClient, err := h.createServiceAccountClient()
	if err != nil {
		h.sendErrorResponse("Failed to create service account to handle user setting request: %v", err, w)
		return
	}

	userSettingMeta, err := h.getUserSettingMeta(context, user)
	if err != nil {
		h.sendErrorResponse("Failed to get user data to handle user setting request: %v", err, w)
		return
	}

	switch r.Method {
	case http.MethodGet:
		configMap, err := h.getUserSettings(context, serviceAccountClient, userSettingMeta)
		if err != nil {
			h.sendErrorResponse("Failed to get user settings: %v", err, w)
			return
		}
		serverutils.SendResponse(w, http.StatusOK, configMap)
	case http.MethodPost:
		configMap, err := h.createUserSettings(context, serviceAccountClient, userSettingMeta)
		if err != nil {
			h.sendErrorResponse("Failed to create user settings: %v", err, w)
			return
		}
		serverutils.SendResponse(w, http.StatusOK, configMap)
	case http.MethodDelete:
		err := h.deleteUserSettings(context, serviceAccountClient, userSettingMeta)
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

// Fetch the user-setting ConfigMap of the current user, by using his token.
func (h *UserSettingsHandler) getUserSettings(ctx context.Context, client *kubernetes.Clientset, userSettingMeta *UserSettingMeta) (*core.ConfigMap, error) {
	return client.CoreV1().ConfigMaps(namespace).Get(ctx, userSettingMeta.getConfigMapName(), meta.GetOptions{})
}

// Create a new user-setting ConfigMap, incl. Role and RoleBinding for the current user.
// Returns the existing ConfigMap if it is already exist.
func (h *UserSettingsHandler) createUserSettings(ctx context.Context, client *kubernetes.Clientset, userSettingMeta *UserSettingMeta) (*core.ConfigMap, error) {
	role := createRole(userSettingMeta)
	roleBinding := createRoleBinding(userSettingMeta)
	configMap := createConfigMap(userSettingMeta)

	_, err := client.RbacV1().Roles(namespace).Create(ctx, role, meta.CreateOptions{})
	if err != nil && !apierrors.IsAlreadyExists(err) {
		h.deleteUserSettings(ctx, client, userSettingMeta)
		return nil, err
	}

	_, err = client.RbacV1().RoleBindings(namespace).Create(ctx, roleBinding, meta.CreateOptions{})
	if err != nil && !apierrors.IsAlreadyExists(err) {
		h.deleteUserSettings(ctx, client, userSettingMeta)
		return nil, err
	}

	configMap, err = client.CoreV1().ConfigMaps(namespace).Create(ctx, configMap, meta.CreateOptions{})
	if err != nil {
		// Return actual ConfigMap if it is already created
		if apierrors.IsAlreadyExists(err) {
			klog.Infof("User settings ConfigMap \"%s\" already exist, will return existing data.", userSettingMeta.getConfigMapName())
			return client.CoreV1().ConfigMaps(namespace).Get(ctx, userSettingMeta.getConfigMapName(), meta.GetOptions{})
		}
		h.deleteUserSettings(ctx, client, userSettingMeta)
		return nil, err
	}
	return configMap, nil
}

// Deletes the user-setting ConfigMap, Role and RoleBinding of the current user.
// It handles not found responses, so that it does not fail on multiple calls.
func (h *UserSettingsHandler) deleteUserSettings(ctx context.Context, client *kubernetes.Clientset, userSettingMeta *UserSettingMeta) error {
	err := client.RbacV1().RoleBindings(namespace).Delete(ctx, userSettingMeta.getRoleBindingName(), meta.DeleteOptions{})
	if err != nil && !apierrors.IsNotFound(err) {
		return err
	}

	err = client.RbacV1().Roles(namespace).Delete(ctx, userSettingMeta.getRoleName(), meta.DeleteOptions{})
	if err != nil && !apierrors.IsNotFound(err) {
		return err
	}

	err = client.CoreV1().ConfigMaps(namespace).Delete(ctx, userSettingMeta.getConfigMapName(), meta.DeleteOptions{})
	if err != nil && !apierrors.IsNotFound(err) {
		return err
	}

	return nil
}

func (h *UserSettingsHandler) createServiceAccountClient() (*kubernetes.Clientset, error) {
	config := &rest.Config{
		Host:        h.Endpoint,
		BearerToken: h.ServiceAccountToken,
		Transport:   h.Client.Transport,
	}
	return kubernetes.NewForConfig(config)
}

func (h *UserSettingsHandler) createUserProxyClient(user *auth.User) (dynamic.Interface, error) {
	config := &rest.Config{
		Host:        h.Endpoint,
		BearerToken: user.Token,
		Transport:   h.Client.Transport,
	}
	return dynamic.NewForConfig(config)
}

func (h *UserSettingsHandler) getUserSettingMeta(context context.Context, user *auth.User) (*UserSettingMeta, error) {
	client, err := h.createUserProxyClient(user)
	if err != nil {
		return nil, err
	}

	userInfo, err := client.Resource(USER_RESOURCE).Get(context, "~", meta.GetOptions{})
	if err != nil {
		return nil, err
	}

	return newUserSettingMeta(userInfo.GetName(), string(userInfo.GetUID()))
}

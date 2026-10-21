package usersettings

import (
	"context"
	"testing"
	"time"

	authenticationv1 "k8s.io/api/authentication/v1"
	core "k8s.io/api/core/v1"
	rbac "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	k8sfake "k8s.io/client-go/kubernetes/fake"
)

func newTestHandler(objects ...runtime.Object) *UserSettingsHandler {
	return &UserSettingsHandler{
		internalProxiedClient: k8sfake.NewSimpleClientset(objects...),
	}
}

func testUserSettingMeta(t *testing.T, username, uid string) *UserSettingMeta {
	t.Helper()
	m, err := newUserSettingMeta(authenticationv1.UserInfo{Username: username, UID: uid})
	if err != nil {
		t.Fatalf("newUserSettingMeta: %v", err)
	}
	return m
}

func oldUserSettingsResources(baseName, username, uid string, createdAt time.Time, data map[string]string) []runtime.Object {
	ownerRefs := []meta.OwnerReference{
		{
			APIVersion: "user.openshift.io/v1",
			Kind:       "User",
			Name:       username,
			UID:        "unused",
		},
	}

	cm := &core.ConfigMap{
		ObjectMeta: meta.ObjectMeta{
			Name:              baseName,
			Namespace:         namespace,
			CreationTimestamp: meta.NewTime(createdAt),
			OwnerReferences:   ownerRefs,
		},
		Data: data,
	}

	role := &rbac.Role{
		ObjectMeta: meta.ObjectMeta{
			Name:            baseName + "-role",
			Namespace:       namespace,
			OwnerReferences: ownerRefs,
		},
	}

	rb := &rbac.RoleBinding{
		ObjectMeta: meta.ObjectMeta{
			Name:            baseName + "-rolebinding",
			Namespace:       namespace,
			OwnerReferences: ownerRefs,
		},
	}

	return []runtime.Object{cm, role, rb}
}

func assertConfigMapExists(t *testing.T, h *UserSettingsHandler, name string) {
	t.Helper()
	_, err := h.internalProxiedClient.CoreV1().ConfigMaps(namespace).Get(context.Background(), name, meta.GetOptions{})
	if err != nil {
		t.Errorf("expected ConfigMap %q to exist, got: %v", name, err)
	}
}

func assertConfigMapNotFound(t *testing.T, h *UserSettingsHandler, name string) {
	t.Helper()
	_, err := h.internalProxiedClient.CoreV1().ConfigMaps(namespace).Get(context.Background(), name, meta.GetOptions{})
	if !apierrors.IsNotFound(err) {
		t.Errorf("expected ConfigMap %q to be deleted, got err: %v", name, err)
	}
}

func assertRoleNotFound(t *testing.T, h *UserSettingsHandler, name string) {
	t.Helper()
	_, err := h.internalProxiedClient.RbacV1().Roles(namespace).Get(context.Background(), name, meta.GetOptions{})
	if !apierrors.IsNotFound(err) {
		t.Errorf("expected Role %q to be deleted, got err: %v", name, err)
	}
}

func assertRoleBindingNotFound(t *testing.T, h *UserSettingsHandler, name string) {
	t.Helper()
	_, err := h.internalProxiedClient.RbacV1().RoleBindings(namespace).Get(context.Background(), name, meta.GetOptions{})
	if !apierrors.IsNotFound(err) {
		t.Errorf("expected RoleBinding %q to be deleted, got err: %v", name, err)
	}
}

func TestCreateUserSettings(t *testing.T) {
	usm := testUserSettingMeta(t, "developer", "uid-1")
	newCMName := usm.getConfigMapName()
	newRoleName := usm.getRoleName()
	newRBName := usm.getRoleBindingName()

	t.Run("fresh creation with no existing resources", func(t *testing.T) {
		h := newTestHandler()

		cm, err := h.createUserSettings(context.Background(), usm)
		if err != nil {
			t.Fatalf("createUserSettings: %v", err)
		}

		if cm.Name != newCMName {
			t.Errorf("expected ConfigMap name %q, got %q", newCMName, cm.Name)
		}
		if cm.Data != nil {
			t.Errorf("expected nil Data for fresh ConfigMap, got %v", cm.Data)
		}

		assertConfigMapExists(t, h, newCMName)
		if _, err := h.internalProxiedClient.RbacV1().Roles(namespace).Get(context.Background(), newRoleName, meta.GetOptions{}); err != nil {
			t.Errorf("expected Role %q to exist: %v", newRoleName, err)
		}
		if _, err := h.internalProxiedClient.RbacV1().RoleBindings(namespace).Get(context.Background(), newRBName, meta.GetOptions{}); err != nil {
			t.Errorf("expected RoleBinding %q to exist: %v", newRBName, err)
		}
	})

	t.Run("short-circuit when new ConfigMap already exists", func(t *testing.T) {
		existingCM := &core.ConfigMap{
			ObjectMeta: meta.ObjectMeta{
				Name:      newCMName,
				Namespace: namespace,
			},
			Data: map[string]string{"existing-key": "existing-value"},
		}
		h := newTestHandler(existingCM)

		cm, err := h.createUserSettings(context.Background(), usm)
		if err != nil {
			t.Fatalf("createUserSettings: %v", err)
		}

		if cm.Data["existing-key"] != "existing-value" {
			t.Errorf("expected existing data to be preserved, got %v", cm.Data)
		}

		// Role and RoleBinding should NOT have been created
		_, roleErr := h.internalProxiedClient.RbacV1().Roles(namespace).Get(context.Background(), newRoleName, meta.GetOptions{})
		if !apierrors.IsNotFound(roleErr) {
			t.Errorf("expected Role not to be created during short-circuit, got err: %v", roleErr)
		}
	})

	t.Run("migrate single old ConfigMap", func(t *testing.T) {
		oldName := "user-settings-uid-1"
		objs := oldUserSettingsResources(oldName, "developer", "uid-1", time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), map[string]string{"theme": "dark"})
		h := newTestHandler(objs...)

		cm, err := h.createUserSettings(context.Background(), usm)
		if err != nil {
			t.Fatalf("createUserSettings: %v", err)
		}

		if cm.Name != newCMName {
			t.Errorf("expected ConfigMap name %q, got %q", newCMName, cm.Name)
		}
		if cm.Data["theme"] != "dark" {
			t.Errorf("expected migrated data {theme: dark}, got %v", cm.Data)
		}

		assertConfigMapNotFound(t, h, oldName)
		assertRoleNotFound(t, h, oldName+"-role")
		assertRoleBindingNotFound(t, h, oldName+"-rolebinding")
	})

	t.Run("migrate latest of multiple old ConfigMaps", func(t *testing.T) {
		older := oldUserSettingsResources("user-settings-old-uid-1", "developer", "old-uid-1",
			time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), map[string]string{"theme": "light"})
		newer := oldUserSettingsResources("user-settings-old-uid-2", "developer", "old-uid-2",
			time.Date(2025, 6, 1, 0, 0, 0, 0, time.UTC), map[string]string{"theme": "dark", "lang": "en"})

		var objs []runtime.Object
		objs = append(objs, older...)
		objs = append(objs, newer...)
		h := newTestHandler(objs...)

		cm, err := h.createUserSettings(context.Background(), usm)
		if err != nil {
			t.Fatalf("createUserSettings: %v", err)
		}

		if cm.Data["theme"] != "dark" || cm.Data["lang"] != "en" {
			t.Errorf("expected data from newer ConfigMap, got %v", cm.Data)
		}

		// Both old sets of resources should be cleaned up
		assertConfigMapNotFound(t, h, "user-settings-old-uid-1")
		assertRoleNotFound(t, h, "user-settings-old-uid-1-role")
		assertRoleBindingNotFound(t, h, "user-settings-old-uid-1-rolebinding")
		assertConfigMapNotFound(t, h, "user-settings-old-uid-2")
		assertRoleNotFound(t, h, "user-settings-old-uid-2-role")
		assertRoleBindingNotFound(t, h, "user-settings-old-uid-2-rolebinding")
	})

	t.Run("ignores ConfigMap owned by different user", func(t *testing.T) {
		otherName := "user-settings-other-uid"
		objs := oldUserSettingsResources(otherName, "other-user", "other-uid",
			time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), map[string]string{"theme": "blue"})
		h := newTestHandler(objs...)

		cm, err := h.createUserSettings(context.Background(), usm)
		if err != nil {
			t.Fatalf("createUserSettings: %v", err)
		}

		if cm.Data != nil {
			t.Errorf("expected nil Data (no migration), got %v", cm.Data)
		}

		// Other user's resources must be untouched
		assertConfigMapExists(t, h, otherName)
	})

	t.Run("ignores ConfigMap without OwnerReference", func(t *testing.T) {
		orphanCM := &core.ConfigMap{
			ObjectMeta: meta.ObjectMeta{
				Name:      "user-settings-orphan",
				Namespace: namespace,
			},
			Data: map[string]string{"theme": "orphan"},
		}
		h := newTestHandler(orphanCM)

		cm, err := h.createUserSettings(context.Background(), usm)
		if err != nil {
			t.Fatalf("createUserSettings: %v", err)
		}

		if cm.Data != nil {
			t.Errorf("expected nil Data (no migration), got %v", cm.Data)
		}

		assertConfigMapExists(t, h, "user-settings-orphan")
	})
}

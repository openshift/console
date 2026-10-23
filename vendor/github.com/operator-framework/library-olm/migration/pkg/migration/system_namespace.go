package migration

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"math/big"
	"strings"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/util/validation"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	suggestedNamespaceTemplateAnnotation = "operatorframework.io/suggested-namespace-template"
	suggestedNamespaceAnnotation         = "operatorframework.io/suggested-namespace"
	maxNamespaceNameLength               = 63
)

// IncludeSystemManagedNamespace adds a prepared target Namespace to the imported
// revision. Without it, the controller's catalog revision sees the target
// Namespace as unowned and cannot take it over with collision protection enabled.
func (m *Migrator) IncludeSystemManagedNamespace(ctx context.Context, info *MigrationInfo, name string) error {
	var namespace corev1.Namespace
	if err := m.Client.Get(ctx, client.ObjectKey{Name: name}, &namespace); err != nil {
		return fmt.Errorf("get prepared system-managed namespace %q: %w", name, err)
	}
	obj := unstructured.Unstructured{}
	obj.SetAPIVersion("v1")
	obj.SetKind("Namespace")
	obj.SetName(name)
	obj.SetLabels(namespace.Labels)
	obj.SetAnnotations(namespace.Annotations)
	for i := range info.CollectedObjects {
		if info.CollectedObjects[i].GetAPIVersion() == "v1" && info.CollectedObjects[i].GetKind() == "Namespace" && info.CollectedObjects[i].GetName() == name {
			info.CollectedObjects[i] = obj
			return nil
		}
	}
	info.CollectedObjects = append(info.CollectedObjects, obj)
	return nil
}

func validateSystemManagedInstallNamespace(opts Options) error {
	if opts.SystemManagedInstallNamespace && opts.InstallNamespace == opts.SubscriptionNamespace {
		return fmt.Errorf("system-managed install namespace resolves to source namespace %q; use standard migration without --system-managed-install-namespace", opts.SubscriptionNamespace)
	}
	return nil
}

// EffectiveInstallNamespace returns the namespace into which migration's COS
// objects must be placed. System-managed mode still omits spec.namespace from
// the ClusterExtension; this value is only used to move the existing OLMv0
// objects to the namespace that operator-controller will resolve from the
// same bundle metadata.
func (o Options) EffectiveInstallNamespace(packageName string, annotations map[string]string) (string, error) {
	if !o.SystemManagedInstallNamespace {
		return o.InstallNamespace, nil
	}
	return resolveSystemManagedInstallNamespace(packageName, annotations)
}

// resolveSystemManagedInstallNamespace mirrors operator-controller's
// experimental namespace resolution: suggested template name, then suggested
// namespace, then a deterministic package-derived default. Keep this in sync
// with operator-controller/internal/operator-controller/rukpak/render.
func resolveSystemManagedInstallNamespace(packageName string, annotations map[string]string) (string, error) {
	var template corev1.Namespace
	if raw := annotations[suggestedNamespaceTemplateAnnotation]; raw != "" {
		if err := json.Unmarshal([]byte(raw), &template); err != nil {
			return "", fmt.Errorf("parse suggested namespace template: %w", err)
		}
	}

	name := template.Name
	if name == "" {
		name = annotations[suggestedNamespaceAnnotation]
	}
	if name == "" {
		name = defaultSystemManagedNamespace(packageName)
	}
	if errs := validation.IsDNS1123Label(name); len(errs) > 0 {
		return "", fmt.Errorf("resolved system-managed namespace %q is invalid: %s", name, strings.Join(errs, "; "))
	}
	return name, nil
}

func defaultSystemManagedNamespace(packageName string) string {
	const (
		suffix     = "system"
		hashLength = 8
		maxBase    = maxNamespaceNameLength - len(suffix) - hashLength - 2
	)
	base := sanitizeDNS1123Label(packageName)
	if base != "" && base == packageName && len(base)+1+len(suffix) <= maxNamespaceNameLength {
		return base + "-" + suffix
	}

	hash := systemManagedNamespaceHash(packageName)[:hashLength]
	if len(base) > maxBase {
		base = base[:maxBase]
	}
	base = strings.Trim(base, "-")
	if base == "" {
		return hash + "-" + suffix
	}
	return base + "-" + hash + "-" + suffix
}

func sanitizeDNS1123Label(value string) string {
	var b strings.Builder
	lastHyphen := false
	for _, r := range strings.ToLower(value) {
		switch {
		case r >= 'a' && r <= 'z' || r >= '0' && r <= '9':
			b.WriteRune(r)
			lastHyphen = false
		case !lastHyphen:
			b.WriteByte('-')
			lastHyphen = true
		}
	}
	return strings.Trim(b.String(), "-")
}

func systemManagedNamespaceHash(value string) string {
	hash := sha256.New224()
	serialized, err := json.Marshal(value)
	if err != nil {
		panic(fmt.Sprintf("marshal namespace name for hash: %v", err))
	}
	_, _ = hash.Write(append(serialized, '\n'))
	var number big.Int
	number.SetBytes(hash.Sum(nil))
	return number.Text(36)
}

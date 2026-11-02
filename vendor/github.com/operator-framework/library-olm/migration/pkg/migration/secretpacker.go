package migration

// SecretPacker packs serialized objects from COS phases into one or more immutable
// Secrets so that large bundles do not exceed Kubernetes etcd's size limit.
//
// Ported from operator-controller internal/operator-controller/applier/secretpacker.go.
// Objects are gzip-compressed when they exceed gzipThreshold, and a new Secret is
// started whenever the current batch would exceed maxSecretDataSize.

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"sort"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/utils/ptr"

	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	ocv1ac "github.com/operator-framework/operator-controller/applyconfigurations/api/v1"
)

const (
	// maxSecretDataSize is the target maximum for Secret .data size before starting a
	// new Secret. 900 KiB leaves headroom for base64 overhead within etcd's 1.5 MiB limit.
	maxSecretDataSize = 900 * 1024

	// gzipThreshold is the object size above which individual objects are compressed before storage.
	gzipThreshold = 900 * 1024
)

// secretPacker packs serialized COS phase objects into immutable Secrets.
type secretPacker struct {
	// RevisionName is the COS name — used to derive Secret names.
	RevisionName string
	// OwnerName is the CE name — recorded as a label on each Secret.
	OwnerName string
	// SystemNamespace is where Secrets are created (the discovered
	// operator-controller namespace, unless explicitly overridden).
	SystemNamespace string
}

// packResult holds the packed Secrets and the ref entries that replace inline objects.
type packResult struct {
	// Secrets to be created before the COS.
	Secrets []corev1.Secret
	// Refs maps (phaseIndex, objectIndex) to the ObjectSourceRef that replaces the inline object.
	Refs map[[2]int]ocv1.ObjectSourceRef
}

// pack takes COS phases with inline objects and produces:
//  1. A set of immutable Secrets containing the serialized objects.
//  2. A mapping from (phaseIdx, objIdx) to the corresponding ObjectSourceRef.
func (p *secretPacker) pack(phases []*ocv1ac.ClusterObjectSetPhaseApplyConfiguration) (*packResult, error) {
	result := &packResult{
		Refs: make(map[[2]int]ocv1.ObjectSourceRef),
	}

	type pendingRef struct {
		pos [2]int
		key string
	}

	var (
		currentData    = make(map[string][]byte)
		currentSize    int
		currentPending []pendingRef
	)

	finalizeCurrent := func() {
		if len(currentData) == 0 {
			return
		}
		secret := p.newSecret(currentData)
		for _, pr := range currentPending {
			result.Refs[pr.pos] = ocv1.ObjectSourceRef{
				Name:      secret.Name,
				Namespace: p.SystemNamespace,
				Key:       pr.key,
			}
		}
		result.Secrets = append(result.Secrets, secret)
		currentData = make(map[string][]byte)
		currentSize = 0
		currentPending = nil
	}

	for phaseIdx, phase := range phases {
		for objIdx, obj := range phase.Objects {
			if obj.Object == nil {
				continue // already a ref
			}

			data, err := json.Marshal(obj.Object)
			if err != nil {
				return nil, fmt.Errorf("serializing object in phase %d index %d: %w", phaseIdx, objIdx, err)
			}

			if len(data) > gzipThreshold {
				compressed, cErr := gzipData(data)
				if cErr != nil {
					return nil, fmt.Errorf("compressing object in phase %d index %d: %w", phaseIdx, objIdx, cErr)
				}
				data = compressed
			}

			if len(data) > maxSecretDataSize {
				return nil, fmt.Errorf(
					"object in phase %d index %d exceeds maximum Secret data size (%d bytes > %d bytes) even after compression",
					phaseIdx, objIdx, len(data), maxSecretDataSize,
				)
			}

			key := contentHash(data)

			if _, exists := currentData[key]; !exists {
				if currentSize+len(data) > maxSecretDataSize && len(currentData) > 0 {
					finalizeCurrent()
				}
				currentData[key] = data
				currentSize += len(data)
			}
			currentPending = append(currentPending, pendingRef{pos: [2]int{phaseIdx, objIdx}, key: key})
		}
	}
	finalizeCurrent()

	return result, nil
}

func (p *secretPacker) newSecret(data map[string][]byte) corev1.Secret {
	return corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      p.secretNameFromData(data),
			Namespace: p.SystemNamespace,
			Labels: map[string]string{
				LabelRevisionName: p.RevisionName,
				LabelOwnerName:    p.OwnerName,
			},
		},
		Immutable: ptr.To(true),
		Type:      corev1.SecretType(SecretTypeObjectData), //nolint:gosec // G101 false positive
		Data:      data,
	}
}

func (p *secretPacker) secretNameFromData(data map[string][]byte) string {
	h := sha256.New()
	keys := make([]string, 0, len(data))
	for k := range data {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		h.Write([]byte(k))
		h.Write(data[k])
	}
	return fmt.Sprintf("%s-%x", p.RevisionName, h.Sum(nil)[:8])
}

func contentHash(data []byte) string {
	h := sha256.Sum256(data)
	return base64.RawURLEncoding.EncodeToString(h[:])
}

func gzipData(data []byte) ([]byte, error) {
	var buf bytes.Buffer
	w, err := gzip.NewWriterLevel(&buf, gzip.BestCompression)
	if err != nil {
		return nil, err
	}
	if _, err := w.Write(data); err != nil {
		return nil, err
	}
	if err := w.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

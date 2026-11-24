package olm

import (
	"context"
	"errors"
	"testing"

	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	"github.com/stretchr/testify/require"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"
)

// TestRecoveryScanFailureGuidance preserves API error classification while explaining how to retry a failed scan.
func TestRecoveryScanFailureGuidance(t *testing.T) {
	for _, resource := range []string{"ClusterExtensions", "ClusterObjectSets", "ClusterObjectDeployments", "migration recovery checkpoints"} {
		t.Run(resource, func(t *testing.T) {
			kubeClient := newMigrationTestClient(t, &appsv1.Deployment{ObjectMeta: metav1.ObjectMeta{
				Name: operatorMigrationControllerDeployName, Namespace: "system",
				Labels: map[string]string{operatorMigrationControllerDeployLabel: operatorMigrationControllerDeployValue},
			}})
			forbidden := apierrors.NewForbidden(schema.GroupResource{Resource: "test-resource"}, "", errors.New("read access denied"))
			caller := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{List: func(ctx context.Context, cl client.WithWatch, list client.ObjectList, options ...client.ListOption) error {
				kind := ""
				switch list.(type) {
				case *ocv1.ClusterExtensionList:
					kind = "ClusterExtensions"
				case *ocv1.ClusterObjectSetList:
					kind = "ClusterObjectSets"
				case *ocv1.ClusterObjectDeploymentList:
					kind = "ClusterObjectDeployments"
				case *corev1.SecretList:
					kind = "migration recovery checkpoints"
				}
				if kind == resource {
					return forbidden
				}
				return cl.List(ctx, list, options...)
			}})

			_, err := listOperatorMigrationRecoveryConflicts(context.Background(), caller)

			require.ErrorContains(t, err, "Cannot list "+resource)
			require.ErrorContains(t, err, "read permissions")
			require.ErrorContains(t, err, "retry the scan")
			require.ErrorIs(t, err, forbidden)
			require.True(t, apierrors.IsForbidden(err), "guidance must preserve the API status for callers")
		})
	}
}

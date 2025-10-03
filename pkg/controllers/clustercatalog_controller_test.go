package controllers

import (
	"context"
	"errors"
	"testing"

	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

type mockCatalogService struct {
	updateCatalogCalled bool
	removeCatalogCalled bool
	updateError         error
	removeError         error
	lastCatalogName     string
	lastBaseURL         string
}

const testCatalogName = "test-catalog"

func (m *mockCatalogService) UpdateCatalog(catalogName string, baseURL string) error {
	m.updateCatalogCalled = true
	m.lastCatalogName = catalogName
	m.lastBaseURL = baseURL
	return m.updateError
}

func (m *mockCatalogService) RemoveCatalog(catalogName string) error {
	m.removeCatalogCalled = true
	m.lastCatalogName = catalogName
	return m.removeError
}

func createTestReconciler(objects ...client.Object) (*ClusterCatalogReconciler, *mockCatalogService) {
	scheme := runtime.NewScheme()
	_ = ocv1.AddToScheme(scheme)

	fakeClient := fake.NewClientBuilder().WithScheme(scheme).WithObjects(objects...).Build()
	mockService := &mockCatalogService{}

	return &ClusterCatalogReconciler{
		Client:         fakeClient,
		Scheme:         scheme,
		catalogService: mockService,
	}, mockService
}

func TestReconcileClusterCatalogNotFound(t *testing.T) {
	reconciler, mockService := createTestReconciler()

	req := reconcile.Request{
		NamespacedName: types.NamespacedName{
			Name: testCatalogName,
		},
	}

	result, err := reconciler.Reconcile(context.Background(), req)

	require.NoError(t, err)
	assert.Equal(t, reconcile.Result{}, result)
	assert.True(t, mockService.removeCatalogCalled)
	assert.Equal(t, testCatalogName, mockService.lastCatalogName)
}

func TestReconcileClusterCatalogNoURLs(t *testing.T) {
	clusterCatalog := &ocv1.ClusterCatalog{
		ObjectMeta: metav1.ObjectMeta{
			Name: testCatalogName,
		},
		Status: ocv1.ClusterCatalogStatus{
			URLs: nil,
		},
	}

	reconciler, mockService := createTestReconciler(clusterCatalog)

	req := reconcile.Request{
		NamespacedName: types.NamespacedName{
			Name: testCatalogName,
		},
	}

	result, err := reconciler.Reconcile(context.Background(), req)

	require.NoError(t, err)
	assert.Equal(t, reconcile.Result{}, result)
	assert.False(t, mockService.updateCatalogCalled)
	assert.False(t, mockService.removeCatalogCalled)
}

func TestReconcileClusterCatalogEmptyBaseURL(t *testing.T) {
	clusterCatalog := &ocv1.ClusterCatalog{
		ObjectMeta: metav1.ObjectMeta{
			Name: testCatalogName,
		},
		Status: ocv1.ClusterCatalogStatus{
			URLs: &ocv1.ClusterCatalogURLs{
				Base: "",
			},
		},
	}

	reconciler, mockService := createTestReconciler(clusterCatalog)

	req := reconcile.Request{
		NamespacedName: types.NamespacedName{
			Name: testCatalogName,
		},
	}

	result, err := reconciler.Reconcile(context.Background(), req)

	require.NoError(t, err)
	assert.Equal(t, reconcile.Result{}, result)
	assert.False(t, mockService.updateCatalogCalled)
	assert.False(t, mockService.removeCatalogCalled)
}

func TestReconcileClusterCatalogSuccess(t *testing.T) {
	clusterCatalog := &ocv1.ClusterCatalog{
		ObjectMeta: metav1.ObjectMeta{
			Name: testCatalogName,
		},
		Status: ocv1.ClusterCatalogStatus{
			URLs: &ocv1.ClusterCatalogURLs{
				Base: "https://example.com/catalog",
			},
		},
	}

	reconciler, mockService := createTestReconciler(clusterCatalog)

	req := reconcile.Request{
		NamespacedName: types.NamespacedName{
			Name: testCatalogName,
		},
	}

	result, err := reconciler.Reconcile(context.Background(), req)

	require.NoError(t, err)
	assert.Equal(t, reconcile.Result{}, result)
	assert.True(t, mockService.updateCatalogCalled)
	assert.Equal(t, testCatalogName, mockService.lastCatalogName)
	assert.Equal(t, "https://example.com/catalog", mockService.lastBaseURL)
}

func TestReconcileUpdateCatalogError(t *testing.T) {
	clusterCatalog := &ocv1.ClusterCatalog{
		ObjectMeta: metav1.ObjectMeta{
			Name: testCatalogName,
		},
		Status: ocv1.ClusterCatalogStatus{
			URLs: &ocv1.ClusterCatalogURLs{
				Base: "https://example.com/catalog",
			},
		},
	}

	reconciler, mockService := createTestReconciler(clusterCatalog)
	mockService.updateError = errors.New("mock update failed")

	req := reconcile.Request{
		NamespacedName: types.NamespacedName{
			Name: testCatalogName,
		},
	}

	result, err := reconciler.Reconcile(context.Background(), req)

	require.Error(t, err)
	assert.Equal(t, reconcile.Result{}, result)
	assert.True(t, mockService.updateCatalogCalled)
}

func TestReconcileRemoveCatalogError(t *testing.T) {
	reconciler, mockService := createTestReconciler()
	mockService.removeError = errors.New("mock remove failed")

	req := reconcile.Request{
		NamespacedName: types.NamespacedName{
			Name: testCatalogName,
		},
	}

	result, err := reconciler.Reconcile(context.Background(), req)

	require.Error(t, err)
	assert.Equal(t, reconcile.Result{}, result)
	assert.True(t, mockService.removeCatalogCalled)
}

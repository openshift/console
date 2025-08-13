package controllers

import (
	"context"

	// ocv1 "github.com/operator-framework/operator-controller/api/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

// ClusterCatalogReconciler reconciles ClusterCatalog resources
type ClusterCatalogReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// NewClusterCatalogReconciler creates a new ClusterCatalogReconciler
func NewClusterCatalogReconciler(mgr ctrl.Manager) *ClusterCatalogReconciler {
	return &ClusterCatalogReconciler{
		Client: mgr.GetClient(),
		Scheme: mgr.GetScheme(),
	}
}

// Reconcile implements the reconcile.Reconciler interface
func (r *ClusterCatalogReconciler) Reconcile(ctx context.Context, req reconcile.Request) (reconcile.Result, error) {
	log := ctrl.LoggerFrom(ctx)
	log.Info("Reconciling ClusterCatalog", "name", req.Name)

	// Fetch the ClusterCatalog
	clusterCatalog := &unstructured.Unstructured{}
	clusterCatalog.SetGroupVersionKind(schema.GroupVersionKind{
		Group:   "olm.operatorframework.io",
		Version: "v1",
		Kind:    "ClusterCatalog",
	})

	err := r.Get(ctx, req.NamespacedName, clusterCatalog)
	if err != nil {
		return ctrl.Result{}, err
	}
	// TODO

	return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller with the Manager
func (r *ClusterCatalogReconciler) SetupWithManager(mgr ctrl.Manager) error {
	clusterCatalog := &unstructured.Unstructured{}
	clusterCatalog.SetGroupVersionKind(schema.GroupVersionKind{
		Group:   "olm.operatorframework.io",
		Version: "v1",
		Kind:    "ClusterCatalog",
	})
	_, err := ctrl.NewControllerManagedBy(mgr).
		For(clusterCatalog).
		Build(r)

	return err
}

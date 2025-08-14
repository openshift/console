package controllers

import (
	"context"

	// ocv1 "github.com/operator-framework/operator-controller/api/v1"
	"github.com/openshift/console/pkg/olm"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
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
	Scheme         *runtime.Scheme
	catalogService *olm.CatalogService
}

// NewClusterCatalogReconciler creates a new ClusterCatalogReconciler
func NewClusterCatalogReconciler(mgr ctrl.Manager, catalogService *olm.CatalogService) *ClusterCatalogReconciler {
	return &ClusterCatalogReconciler{
		Client:         mgr.GetClient(),
		Scheme:         mgr.GetScheme(),
		catalogService: catalogService,
	}
}

// Reconcile implements the reconcile.Reconciler interface
func (r *ClusterCatalogReconciler) Reconcile(ctx context.Context, req reconcile.Request) (reconcile.Result, error) {
	log := ctrl.LoggerFrom(ctx)
	log.Info("Reconciling ClusterCatalog", "name", req.Name)
	defer log.Info("ClusterCatalog reconcilation ending")

	// Would be good to import the actual ocv1.ClusterCatalog from operator-controller but
	// currently running into a dependency conflict since kubectl-operator uses an old op-con version
	clusterCatalog := &unstructured.Unstructured{}
	clusterCatalog.SetGroupVersionKind(schema.GroupVersionKind{
		Group:   "olm.operatorframework.io",
		Version: "v1",
		Kind:    "ClusterCatalog",
	})

	err := r.Get(ctx, req.NamespacedName, clusterCatalog)
	if err != nil {
		if apierrors.IsNotFound(err) {
			// The ClusterCatalog has been deleted, delete its CatalogItems from the cache
			log.Info("Removing CatalogItems for ClusterCatalog from cache", "name", req.Name)
			r.catalogService.RemoveCatalogItemsFromClusterCatalogFromCache(req.Name)
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	// The ClusterCatalog has been found on the cluster, add to or update cache
	baseURL, found, err := unstructured.NestedString(clusterCatalog.Object, "status", "urls", "base")
	if err != nil {
		return ctrl.Result{}, err
	}

	if found && baseURL != "" {
		err = r.catalogService.AddCatalogItemsFromClusterCatalogToCache(req.Name, baseURL)
		if err != nil {
			return ctrl.Result{}, err
		}
	}

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

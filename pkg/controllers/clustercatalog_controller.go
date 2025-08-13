package controllers

import (
	"context"

	"github.com/openshift/console/pkg/olm"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

// ClusterCatalogReconciler reconciles ClusterCatalog resources
type ClusterCatalogReconciler struct {
	client.Client
	Scheme         *runtime.Scheme
	catalogService olm.CatalogService
}

// NewClusterCatalogReconciler creates a new ClusterCatalogReconciler
func NewClusterCatalogReconciler(mgr ctrl.Manager, cs olm.CatalogService) *ClusterCatalogReconciler {
	return &ClusterCatalogReconciler{
		Client:         mgr.GetClient(),
		Scheme:         mgr.GetScheme(),
		catalogService: cs,
	}
}

// Reconcile implements the reconcile.Reconciler interface
func (r *ClusterCatalogReconciler) Reconcile(ctx context.Context, req reconcile.Request) (reconcile.Result, error) {
	log := ctrl.LoggerFrom(ctx)
	log.Info("Reconciling ClusterCatalog", "name", req.Name)
	defer log.Info("ClusterCatalog reconcilation ending")

	clusterCatalog := &ocv1.ClusterCatalog{}

	err := r.Get(ctx, req.NamespacedName, clusterCatalog)
	if err != nil {
		if apierrors.IsNotFound(err) {
			// The ClusterCatalog has been deleted, delete its CatalogItems from the cache
			log.Info("Removing CatalogItems for ClusterCatalog from cache", "name", req.Name)
			err = r.catalogService.RemoveCatalog(req.Name)
			if err != nil {
				return ctrl.Result{}, err
			}
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	// The ClusterCatalog has been found on the cluster, add to or update cache
	baseURL := clusterCatalog.Status.URLs.Base

	if baseURL != "" {
		err = r.catalogService.UpdateCatalog(req.Name, baseURL)
		if err != nil {
			return ctrl.Result{}, err
		}
	}

	return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller with the Manager
func (r *ClusterCatalogReconciler) SetupWithManager(mgr ctrl.Manager) error {
	utilruntime.Must(ocv1.AddToScheme(mgr.GetScheme()))

	clusterCatalog := &ocv1.ClusterCatalog{}

	_, err := ctrl.NewControllerManagedBy(mgr).
		For(clusterCatalog).
		Build(r)

	return err
}

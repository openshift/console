// Command web-terminal-routing is an external DevWorkspaceRouting solver for
// plain Kubernetes.
//
// The DevWorkspace Operator only serves the console's web terminals
// (routingClass web-terminal / cluster-tls) on OpenShift: the solver adds the
// OpenShift service-CA annotation to the workspace Service and mounts the
// resulting Secret, and on Kubernetes the operator rejects those classes.
// Routing classes the operator does not know are left to external
// controllers. This controller handles one such class: it creates the same
// Service, has cert-manager issue the serving certificate, mounts it where
// web-terminal-exec expects it, and reports the https URL.
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"reflect"
	"syscall"
	"time"

	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/dynamic/dynamicinformer"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/workqueue"
	"k8s.io/klog/v2"
)

var (
	routingGVR     = schema.GroupVersionResource{Group: "controller.devfile.io", Version: "v1alpha1", Resource: "devworkspaceroutings"}
	serviceGVR     = schema.GroupVersionResource{Version: "v1", Resource: "services"}
	certificateGVR = schema.GroupVersionResource{Group: "cert-manager.io", Version: "v1", Resource: "certificates"}
	secretGVR      = schema.GroupVersionResource{Version: "v1", Resource: "secrets"}
)

const fieldManager = "web-terminal-routing"

type controller struct {
	client       dynamic.Interface
	routingClass string
	issuer       Issuer
	routings     cache.GenericLister
	certificates cache.GenericLister
	queue        workqueue.TypedRateLimitingInterface[string]
}

func main() {
	klog.InitFlags(nil)
	routingClass := flag.String("routing-class", "web-terminal-k8s", "DevWorkspaceRouting spec.routingClass this controller handles. Must not be one the DevWorkspace Operator handles itself (basic, cluster, cluster-tls, web-terminal).")
	issuerName := flag.String("issuer-name", "web-terminal-ca", "cert-manager issuer that signs workspace serving certificates. The console bridge must trust its CA (BRIDGE_SERVICE_CA_FILE).")
	issuerKind := flag.String("issuer-kind", "ClusterIssuer", "Kind of --issuer-name: ClusterIssuer, or Issuer if every workspace namespace has one with that name.")
	kubeconfig := flag.String("kubeconfig", "", "Path to a kubeconfig. Empty means in-cluster configuration.")
	workers := flag.Int("workers", 2, "Number of concurrent reconciles.")
	flag.Parse()

	switch *routingClass {
	case "", "basic", "cluster", "cluster-tls", "web-terminal":
		klog.Exitf("--routing-class %q is empty or handled by the DevWorkspace Operator", *routingClass)
	}
	if *issuerKind != "ClusterIssuer" && *issuerKind != "Issuer" {
		klog.Exitf("--issuer-kind must be ClusterIssuer or Issuer")
	}

	var cfg *rest.Config
	var err error
	if *kubeconfig != "" {
		cfg, err = clientcmd.BuildConfigFromFlags("", *kubeconfig)
	} else {
		cfg, err = rest.InClusterConfig()
	}
	if err != nil {
		klog.Exitf("kubernetes config: %v", err)
	}
	client, err := dynamic.NewForConfig(cfg)
	if err != nil {
		klog.Exitf("dynamic client: %v", err)
	}

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	factory := dynamicinformer.NewDynamicSharedInformerFactory(client, 10*time.Minute)
	ownedFactory := dynamicinformer.NewFilteredDynamicSharedInformerFactory(client, 10*time.Minute, metav1.NamespaceAll,
		func(o *metav1.ListOptions) { o.LabelSelector = managedByLabel + "=" + managedByValue })

	c := &controller{
		client:       client,
		routingClass: *routingClass,
		issuer:       Issuer{Name: *issuerName, Kind: *issuerKind},
		queue: workqueue.NewTypedRateLimitingQueueWithConfig(
			workqueue.DefaultTypedControllerRateLimiter[string](),
			workqueue.TypedRateLimitingQueueConfig[string]{Name: "devworkspaceroutings"}),
	}

	routingInformer := factory.ForResource(routingGVR)
	c.routings = routingInformer.Lister()
	if _, err := routingInformer.Informer().AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    c.enqueue,
		UpdateFunc: func(_, obj interface{}) { c.enqueue(obj) },
	}); err != nil {
		klog.Exitf("routing informer: %v", err)
	}

	// Changes to our Services and Certificates (drift, issuance) requeue the
	// owning routing object.
	for _, gvr := range []schema.GroupVersionResource{serviceGVR, certificateGVR} {
		inf := ownedFactory.ForResource(gvr)
		if gvr == certificateGVR {
			c.certificates = inf.Lister()
		}
		if _, err := inf.Informer().AddEventHandler(cache.ResourceEventHandlerFuncs{
			AddFunc:    c.enqueueOwner,
			UpdateFunc: func(_, obj interface{}) { c.enqueueOwner(obj) },
			DeleteFunc: c.enqueueOwner,
		}); err != nil {
			klog.Exitf("informer for %s: %v", gvr.Resource, err)
		}
	}

	factory.Start(ctx.Done())
	ownedFactory.Start(ctx.Done())
	for gvr, ok := range factory.WaitForCacheSync(ctx.Done()) {
		if !ok {
			klog.Exitf("cache for %s did not sync", gvr.Resource)
		}
	}
	for gvr, ok := range ownedFactory.WaitForCacheSync(ctx.Done()) {
		if !ok {
			klog.Exitf("cache for %s did not sync (is cert-manager installed?)", gvr.Resource)
		}
	}
	klog.Infof("handling routingClass %q, certificates from %s %q", c.routingClass, c.issuer.Kind, c.issuer.Name)

	for i := 0; i < *workers; i++ {
		go wait.UntilWithContext(ctx, c.worker, time.Second)
	}
	<-ctx.Done()
	c.queue.ShutDown()
}

func (c *controller) enqueue(obj interface{}) {
	key, err := cache.MetaNamespaceKeyFunc(obj)
	if err == nil {
		c.queue.Add(key)
	}
}

func (c *controller) enqueueOwner(obj interface{}) {
	if t, ok := obj.(cache.DeletedFinalStateUnknown); ok {
		obj = t.Obj
	}
	u, ok := obj.(*unstructured.Unstructured)
	if !ok {
		return
	}
	for _, ref := range u.GetOwnerReferences() {
		if ref.Kind == "DevWorkspaceRouting" {
			c.queue.Add(u.GetNamespace() + "/" + ref.Name)
		}
	}
}

func (c *controller) worker(ctx context.Context) {
	for {
		key, shutdown := c.queue.Get()
		if shutdown {
			return
		}
		requeue, err := c.reconcile(ctx, key)
		switch {
		case k8serrors.IsConflict(err):
			// The operator updated the object between our read and write;
			// the update event requeues it anyway.
			klog.V(2).Infof("reconcile %s: %v", key, err)
			c.queue.AddRateLimited(key)
		case err != nil:
			klog.Errorf("reconcile %s: %v", key, err)
			c.queue.AddRateLimited(key)
		case requeue > 0:
			c.queue.Forget(key)
			c.queue.AddAfter(key, requeue)
		default:
			c.queue.Forget(key)
		}
		c.queue.Done(key)
	}
}

// reconcile returns a delay after which to look again, for states that are
// not driven by a watched object.
func (c *controller) reconcile(ctx context.Context, key string) (time.Duration, error) {
	ns, name, err := cache.SplitMetaNamespaceKey(key)
	if err != nil {
		return 0, nil
	}
	obj, err := c.routings.ByNamespace(ns).Get(name)
	if k8serrors.IsNotFound(err) {
		return 0, nil
	} else if err != nil {
		return 0, err
	}
	dwr := obj.(*unstructured.Unstructured)
	if class, _, _ := unstructured.NestedString(dwr.Object, "spec", "routingClass"); class != c.routingClass {
		return 0, nil
	}
	if dwr.GetDeletionTimestamp() != nil {
		// Owner references clean up the Service, Certificate and Secret.
		return 0, nil
	}
	if dwr.GetAnnotations()[startedAnnotation] == "false" {
		return 0, c.setStatus(ctx, dwr, map[string]interface{}{
			"phase":   "Stopped",
			"message": "DevWorkspace is not started",
		})
	}

	state, err := desired(dwr, c.issuer)
	if err != nil {
		klog.Errorf("%s: %v", key, err)
		return 0, c.setStatus(ctx, dwr, map[string]interface{}{
			"phase":   "Failed",
			"message": fmt.Sprintf("Unable to provision networking for DevWorkspace: %v", err),
		})
	}
	if state.Service == nil {
		return 0, c.setStatus(ctx, dwr, state.Status)
	}

	if err := c.apply(ctx, serviceGVR, state.Service); err != nil {
		return 0, err
	}
	if err := c.apply(ctx, certificateGVR, state.Certificate); err != nil {
		return 0, err
	}

	cert, err := c.certificates.ByNamespace(ns).Get(state.Certificate.GetName())
	if err != nil || !certificateReady(cert.(*unstructured.Unstructured)) {
		// Report Preparing until the Secret exists. The operator fails a
		// workspace whose pod keeps hitting FailedMount.
		if err := c.setStatus(ctx, dwr, map[string]interface{}{
			"phase":   "Preparing",
			"message": "Waiting for the serving certificate",
		}); err != nil {
			return 0, err
		}
		return 2 * time.Second, nil
	}

	// cert-manager does not set owner references on Secrets unless it runs
	// with --enable-certificate-owner-ref, so each terminal would leave its
	// Secret behind. Adopt it.
	if err := c.adoptSecret(ctx, ns, state.SecretName, dwr); err != nil {
		return 0, err
	}
	return 0, c.setStatus(ctx, dwr, state.Status)
}

func (c *controller) apply(ctx context.Context, gvr schema.GroupVersionResource, obj *unstructured.Unstructured) error {
	data, err := json.Marshal(obj.Object)
	if err != nil {
		return err
	}
	force := true
	_, err = c.client.Resource(gvr).Namespace(obj.GetNamespace()).Patch(ctx, obj.GetName(), types.ApplyPatchType, data,
		metav1.PatchOptions{FieldManager: fieldManager, Force: &force})
	if err != nil {
		return fmt.Errorf("apply %s %s/%s: %w", gvr.Resource, obj.GetNamespace(), obj.GetName(), err)
	}
	return nil
}

func (c *controller) adoptSecret(ctx context.Context, ns, name string, dwr *unstructured.Unstructured) error {
	patch, err := json.Marshal(map[string]interface{}{
		"metadata": map[string]interface{}{
			"ownerReferences": []interface{}{map[string]interface{}{
				"apiVersion":         dwr.GetAPIVersion(),
				"kind":               dwr.GetKind(),
				"name":               dwr.GetName(),
				"uid":                string(dwr.GetUID()),
				"blockOwnerDeletion": false,
			}},
		},
	})
	if err != nil {
		return err
	}
	_, err = c.client.Resource(secretGVR).Namespace(ns).Patch(ctx, name, types.MergePatchType, patch, metav1.PatchOptions{FieldManager: fieldManager})
	if err != nil && !k8serrors.IsNotFound(err) {
		return fmt.Errorf("set owner of secret %s/%s: %w", ns, name, err)
	}
	return nil
}

// setStatus writes status if it differs from the current one.
func (c *controller) setStatus(ctx context.Context, dwr *unstructured.Unstructured, status map[string]interface{}) error {
	current, _, _ := unstructured.NestedMap(dwr.Object, "status")
	if statusEqual(current, status) {
		return nil
	}
	updated := dwr.DeepCopy()
	if err := unstructured.SetNestedMap(updated.Object, status, "status"); err != nil {
		return err
	}
	_, err := c.client.Resource(routingGVR).Namespace(dwr.GetNamespace()).UpdateStatus(ctx, updated, metav1.UpdateOptions{FieldManager: fieldManager})
	if err != nil {
		return fmt.Errorf("update status of %s/%s: %w", dwr.GetNamespace(), dwr.GetName(), err)
	}
	klog.Infof("%s/%s: %v", dwr.GetNamespace(), dwr.GetName(), status["phase"])
	return nil
}

// statusEqual compares through JSON so int64 and float64 numbers match.
func statusEqual(a, b map[string]interface{}) bool {
	norm := func(m map[string]interface{}) interface{} {
		data, _ := json.Marshal(m)
		var out interface{}
		_ = json.Unmarshal(data, &out)
		return out
	}
	return reflect.DeepEqual(norm(a), norm(b))
}

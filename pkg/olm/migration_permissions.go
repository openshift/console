package olm

import (
	"context"
	"fmt"
	"net/url"
	"strings"

	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func migrationRule(group string, resources, verbs, names []string) rbacv1.PolicyRule {
	return rbacv1.PolicyRule{APIGroups: []string{group}, Resources: resources, Verbs: verbs, ResourceNames: names}
}

// Permissions are delegated by the initiating user through normal Kubernetes
// RBAC checks. No cluster-admin binding, impersonation, or user token is saved.
func prepareMigrationExecutionPermissions(ctx context.Context, migrator *migration.Migrator, request operatorMigrationBulkRequest, namespace string) ([]client.Object, error) {
	read := []string{"get", "list", "watch"}
	write := []string{"get", "update", "patch", "delete"}
	clusterRules := []rbacv1.PolicyRule{
		migrationRule("olm.operatorframework.io", []string{"clusterextensions", "clusterobjectsets", "clustercatalogs"}, read, nil),
		migrationRule("apiextensions.k8s.io", []string{"customresourcedefinitions"}, read, nil),
		migrationRule("operators.coreos.com", []string{"operators", "clusterserviceversions"}, read, nil),
		migrationRule("operators.coreos.com", []string{"subscriptions"}, []string{"list"}, nil),
		migrationRule("apps", []string{"deployments"}, read, nil),
		migrationRule("rbac.authorization.k8s.io", []string{"clusterroles", "clusterrolebindings"}, read, nil),
	}
	namespaceRules := map[string][]rbacv1.PolicyRule{
		namespace: {
			migrationRule("", []string{"secrets"}, []string{"get", "list", "create", "update", "patch", "delete"}, nil),
		},
	}
	addNamespace := func(name string) {
		if _, found := namespaceRules[name]; found {
			return
		}
		namespaceRules[name] = []rbacv1.PolicyRule{
			migrationRule("", []string{"pods", "services", "secrets", "configmaps", "serviceaccounts"}, read, nil),
			migrationRule("apps", []string{"deployments"}, read, nil),
			migrationRule("operators.coreos.com", []string{"subscriptions", "clusterserviceversions", "installplans", "operatorgroups", "operatorconditions", "catalogsources"}, read, nil),
			migrationRule("rbac.authorization.k8s.io", []string{"roles", "rolebindings"}, read, nil),
		}
	}
	for _, candidate := range request.Operators {
		request.Acknowledgments.apply(&candidate)
		opts := candidate.options()
		opts.ApplyDefaults()
		prepared, err := migrator.PrepareClusterObjectSet(ctx, opts)
		if err != nil {
			return nil, err
		}
		info, err := migrator.Gather(ctx, prepared)
		if err != nil {
			return nil, err
		}
		addNamespace(opts.SubscriptionNamespace)
		addNamespace(opts.InstallNamespace)
		addNamespace(info.CatalogSourceRef.Namespace)
		addNamespace(prepared.SystemNamespace)
		clusterRules = append(clusterRules,
			migrationRule("", []string{"namespaces"}, []string{"get", "update", "patch"}, []string{opts.SubscriptionNamespace, opts.InstallNamespace, prepared.SystemNamespace}),
			migrationRule("operators.coreos.com", []string{"operators"}, []string{"delete"}, []string{info.PackageName + "." + opts.SubscriptionNamespace}),
			migrationRule("operators.coreos.com", []string{"clusterserviceversions"}, []string{"delete"}, []string{info.BundleName}),
			migrationRule("olm.operatorframework.io", []string{"clusterextensions", "clusterobjectsets"}, []string{"create"}, nil),
			migrationRule("olm.operatorframework.io", []string{"clusterextensions"}, write, []string{opts.ClusterExtensionName}),
			migrationRule("olm.operatorframework.io", []string{"clusterobjectsets"}, write, []string{opts.ClusterExtensionName + "-1"}),
		)
		if opts.AcknowledgeNamespaceDelete {
			clusterRules = append(clusterRules, migrationRule("", []string{"namespaces"}, []string{"delete"}, []string{opts.SubscriptionNamespace}))
		}
		namespaceRules[opts.SubscriptionNamespace] = append(namespaceRules[opts.SubscriptionNamespace],
			migrationRule("operators.coreos.com", []string{"subscriptions"}, []string{"create"}, nil),
			migrationRule("operators.coreos.com", []string{"subscriptions"}, write, []string{opts.SubscriptionName}),
			migrationRule("operators.coreos.com", []string{"subscriptions/status"}, []string{"update", "patch"}, []string{opts.SubscriptionName}),
			migrationRule("operators.coreos.com", []string{"clusterserviceversions", "operatorconditions"}, write, []string{info.BundleName}),
			migrationRule("operators.coreos.com", []string{"operatorgroups"}, []string{"create", "update", "delete"}, nil),
		)
		namespaceRules[prepared.SystemNamespace] = append(namespaceRules[prepared.SystemNamespace], migrationRule("", []string{"secrets"}, []string{"create", "get", "list", "update", "patch", "delete"}, nil))
		for _, object := range info.CollectedObjects {
			mapping, err := migrator.Client.RESTMapper().RESTMapping(object.GroupVersionKind().GroupKind(), object.GroupVersionKind().Version)
			if err != nil {
				return nil, fmt.Errorf("resolve migration resource permissions: %w", err)
			}
			rule := migrationRule(mapping.Resource.Group, []string{mapping.Resource.Resource}, write, []string{object.GetName()})
			if object.GetNamespace() == "" {
				clusterRules = append(clusterRules, rule)
			} else {
				addNamespace(object.GetNamespace())
				namespaceRules[object.GetNamespace()] = append(namespaceRules[object.GetNamespace()], rule, migrationRule(mapping.Resource.Group, []string{mapping.Resource.Resource}, read, nil))
			}
		}
	}
	// Catalog URLs identify the serving namespace, including custom installations.
	var catalogs ocv1.ClusterCatalogList
	if err := migrator.Client.List(ctx, &catalogs); err != nil {
		return nil, err
	}
	for _, catalog := range catalogs.Items {
		if catalog.Status.URLs == nil {
			continue
		}
		u, err := url.Parse(catalog.Status.URLs.Base)
		if err != nil {
			return nil, err
		}
		parts := strings.Split(u.Hostname(), ".")
		if len(parts) < 3 || parts[2] != "svc" {
			continue
		}
		addNamespace(parts[1])
		namespaceRules[parts[1]] = append(namespaceRules[parts[1]], migrationRule("coordination.k8s.io", []string{"leases"}, []string{"get"}, []string{"catalogd-operator-lock"}), migrationRule("", []string{"pods/portforward"}, []string{"create"}, nil))
	}
	// Cross-namespace migration prepares this namespace as an explicit migration
	// action before installing its RoleBindings. No operator resources move yet.
	for _, candidate := range request.Operators {
		opts := candidate.options()
		opts.ApplyDefaults()
		if opts.InstallNamespace != opts.SubscriptionNamespace {
			if err := migrator.PrepareInstallNamespace(ctx, opts); err != nil {
				return nil, err
			}
		}
	}
	subject := rbacv1.Subject{Kind: "ServiceAccount", Name: migrationJobStateName, Namespace: namespace}
	objects := []client.Object{
		&rbacv1.ClusterRole{ObjectMeta: metav1.ObjectMeta{Name: namespace}, Rules: clusterRules},
		&rbacv1.ClusterRoleBinding{ObjectMeta: metav1.ObjectMeta{Name: namespace}, RoleRef: rbacv1.RoleRef{APIGroup: rbacv1.GroupName, Kind: "ClusterRole", Name: namespace}, Subjects: []rbacv1.Subject{subject}},
	}
	for name, rules := range namespaceRules {
		objects = append(objects,
			&rbacv1.Role{ObjectMeta: metav1.ObjectMeta{Name: namespace, Namespace: name}, Rules: rules},
			&rbacv1.RoleBinding{ObjectMeta: metav1.ObjectMeta{Name: namespace, Namespace: name}, RoleRef: rbacv1.RoleRef{APIGroup: rbacv1.GroupName, Kind: "Role", Name: namespace}, Subjects: []rbacv1.Subject{subject}},
		)
	}
	backend := rbacv1.Subject{Kind: "ServiceAccount", Name: "console", Namespace: migrationIndexNamespace}
	backendRules := []rbacv1.PolicyRule{
		migrationRule("", []string{"secrets"}, []string{"get", "list", "create", "update", "patch"}, nil),
		migrationRule("", []string{"serviceaccounts"}, []string{"get", "delete"}, []string{migrationJobStateName}),
		migrationRule("", []string{"serviceaccounts/token"}, []string{"create"}, []string{migrationJobStateName}),
		migrationRule("coordination.k8s.io", []string{"leases"}, []string{"get", "create", "update", "patch"}, nil),
	}
	objects = append(objects,
		&rbacv1.Role{ObjectMeta: metav1.ObjectMeta{Name: "console-resume", Namespace: namespace}, Rules: backendRules},
		&rbacv1.RoleBinding{ObjectMeta: metav1.ObjectMeta{Name: "console-resume", Namespace: namespace}, RoleRef: rbacv1.RoleRef{APIGroup: rbacv1.GroupName, Kind: "Role", Name: "console-resume"}, Subjects: []rbacv1.Subject{backend}},
		&rbacv1.Role{ObjectMeta: metav1.ObjectMeta{Name: namespace, Namespace: migrationIndexNamespace}, Rules: []rbacv1.PolicyRule{migrationRule("", []string{"configmaps"}, []string{"get", "list", "watch"}, nil)}},
		&rbacv1.RoleBinding{ObjectMeta: metav1.ObjectMeta{Name: namespace, Namespace: migrationIndexNamespace}, RoleRef: rbacv1.RoleRef{APIGroup: rbacv1.GroupName, Kind: "Role", Name: namespace}, Subjects: []rbacv1.Subject{backend}},
		&rbacv1.ClusterRole{ObjectMeta: metav1.ObjectMeta{Name: namespace + "-cleanup"}, Rules: []rbacv1.PolicyRule{migrationRule("", []string{"namespaces"}, []string{"get", "delete"}, []string{namespace})}},
		&rbacv1.ClusterRoleBinding{ObjectMeta: metav1.ObjectMeta{Name: namespace + "-cleanup"}, RoleRef: rbacv1.RoleRef{APIGroup: rbacv1.GroupName, Kind: "ClusterRole", Name: namespace + "-cleanup"}, Subjects: []rbacv1.Subject{backend}},
	)
	return objects, nil
}

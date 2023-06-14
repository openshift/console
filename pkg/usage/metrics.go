package usage

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	authv1 "k8s.io/api/authorization/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/klog"
)

// We don't expect that the users metrics (console users count) changes often.
// And because we check the permission for each console user we update this
// only when the bridge starts and then every 6 hours.
const updateConsoleUsersInterval = 6 * time.Hour

// Reduce load peaks when checking permissions for hunders of console users.
// This distributes the requests to 10-20 per second.
// In other words the update takes round about 10 seconds per 100 users.
// Setting this to zero in unit tests.
var delayBetweenConsoleUserPermissionChecks = 100 * time.Millisecond

type Metrics struct {
	usageTotal          *prometheus.CounterVec
	users               *prometheus.GaugeVec
	updatedUserRoleOnce map[UserRole]bool
}

type UserRole string

const (
	KubeadminUserRole    UserRole = "kubeadmin"
	ClusterAdminUserRole UserRole = "cluster-admin"
	DeveloperUserRole    UserRole = "developer"
	UnknownUserRole      UserRole = "unknown"
)

func (m *Metrics) GetCollectors() []prometheus.Collector {
	return []prometheus.Collector{
		m.usageTotal,
		m.users,
	}
}

func (m *Metrics) HandleUsage(event string, perspective string) error {
	counter, err := m.usageTotal.GetMetricWithLabelValues(event, perspective)
	if counter != nil && err == nil {
		counter.Inc()
	}
	return err
}

func (m *Metrics) MonitorUsers(
	userSettingsClient *http.Client,
	userSettingsEndpoint string,
	serviceAccountToken string,
) {
	go func() {
		time.Sleep(5 * time.Second)
		go m.updateUsersMetric(userSettingsClient, userSettingsEndpoint, serviceAccountToken)
	}()

	ticker := time.NewTicker(updateConsoleUsersInterval)
	quit := make(chan struct{})
	go func() {
		for {
			select {
			case <-ticker.C:
				m.updateUsersMetric(userSettingsClient, userSettingsEndpoint, serviceAccountToken)
			case <-quit:
				ticker.Stop()
				return
			}
		}
	}()
}

func (m *Metrics) updateUsersMetric(
	userSettingsClient *http.Client,
	userSettingsEndpoint string,
	serviceAccountToken string,
) error {
	klog.Info("usage.Metrics: Count console users...\n")
	startTime := time.Now()

	ctx := context.TODO()
	config := &rest.Config{
		Host:        userSettingsEndpoint,
		BearerToken: serviceAccountToken,
		Transport:   userSettingsClient.Transport,
	}
	client, err := kubernetes.NewForConfig(config)
	if err != nil {
		klog.Errorf("usage.Metrics: Failed to create service account client: %v\n", err)
		return err
	}

	roleBindingList, err := client.RbacV1().RoleBindings("openshift-console-user-settings").List(ctx, metav1.ListOptions{})
	if err != nil {
		klog.Errorf("usage.Metrics: Failed to get user-settings RoleBindings: %v\n", err)
		return err
	}

	var kubeAdmin, clusterAdmins, developers, unknowns int

	for _, roleBinding := range roleBindingList.Items {
		// Reduce load for clusters with hunders of console users (role bindings)
		time.Sleep(delayBetweenConsoleUserPermissionChecks)

		if !strings.HasPrefix(roleBinding.Name, "user-settings-") || !strings.HasSuffix(roleBinding.Name, "-rolebinding") {
			if klog.V(4) {
				klog.Infof("usage.Metrics: Ignore role binding: %q (name doesn't match user-settings-*-rolebinding)\n", roleBinding.Name)
			}
			continue
		}
		if len(roleBinding.Subjects) != 1 {
			klog.Infof("usage.Metrics: Ignore role binding: %q (unexpected subject length %d != 1)\n", roleBinding.Name, len(roleBinding.Subjects))
			unknowns++
			continue
		}
		user := roleBinding.Subjects[0]
		if user.Kind != "User" {
			klog.Infof("usage.Metrics: Ignore role binding: %q (unexpected subject kind %q != 'User')\n", roleBinding.Name, user.Kind)
			unknowns++
			continue
		}

		if user.Name == "kube:admin" {
			if klog.V(4) {
				klog.Infof("usage.Metrics: Count %q as %q...\n", user.Name, KubeadminUserRole)
			}
			kubeAdmin++
			continue
		}

		canGetNamespacesAccessReview := &authv1.SubjectAccessReview{
			Spec: authv1.SubjectAccessReviewSpec{
				User: user.Name,
				ResourceAttributes: &authv1.ResourceAttributes{
					Verb:     "get",
					Resource: "namespaces",
				},
			},
		}
		res, err := client.AuthorizationV1().SubjectAccessReviews().Create(
			ctx,
			canGetNamespacesAccessReview,
			metav1.CreateOptions{},
		)
		if err != nil {
			klog.Errorf("usage.Metrics: Error when checking permissions for %q: %v\n", user.Name, err)
			unknowns++
			continue
		}

		if res.Status.Allowed {
			if klog.V(4) && clusterAdmins < 10 {
				klog.Infof("usage.Metrics: Count %q as %q...\n", user.Name, ClusterAdminUserRole)
			}
			clusterAdmins++
		} else {
			if klog.V(4) && developers < 10 {
				klog.Infof("usage.Metrics: Count %q as %q...\n", user.Name, DeveloperUserRole)
			}
			developers++
		}
	}

	klog.Infof("usage.Metrics: Update console users metrics: %d %s, %d %ss, %d %ss, %d %s/errors (took %v)\n",
		kubeAdmin, KubeadminUserRole,
		clusterAdmins, ClusterAdminUserRole,
		developers, DeveloperUserRole,
		unknowns, UnknownUserRole,
		time.Since(startTime),
	)
	m.setUserGaugeValue(KubeadminUserRole, kubeAdmin)
	m.setUserGaugeValue(ClusterAdminUserRole, clusterAdmins)
	m.setUserGaugeValue(DeveloperUserRole, developers)
	m.setUserGaugeValue(UnknownUserRole, unknowns)
	return nil
}

func (m *Metrics) setUserGaugeValue(userRole UserRole, count int) {
	// Reduce cardinality if the user role (for example Kubeadmin, but esp. Unknown) is never used.
	if !m.updatedUserRoleOnce[userRole] && count > 0 {
		m.updatedUserRoleOnce[userRole] = true
	}
	if m.updatedUserRoleOnce[userRole] {
		if gauge, err := m.users.GetMetricWithLabelValues(string(userRole)); gauge != nil && err == nil {
			gauge.Set(float64(count))
		}
	}
}

func NewMetrics() *Metrics {
	m := new(Metrics)

	m.usageTotal = prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace: "console",
		Subsystem: "usage",
		Name:      "total",
		Help:      "Total number of events like \"page_views\" (loading index.html without history.push) and \"page_impressions\".",
	}, []string{"event", "perspective"})

	events := []string{"page_view", "page_impression"}
	perspectives := []string{"admin", "dev"} // the developer perspective uses "dev" has perspective ID!
	for _, event := range events {
		for _, perspective := range perspectives {
			m.usageTotal.GetMetricWithLabelValues(event, perspective)
		}
	}

	m.users = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: "console",
		Subsystem: "usage",
		Name:      "users",
		Help:      "The number of console users splitten into roles (cluster-admin, developer, and unknown if a RBAC check fails)",
	}, []string{"role"})

	m.updatedUserRoleOnce = map[UserRole]bool{}

	return m
}

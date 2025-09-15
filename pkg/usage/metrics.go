package usage

import (
	"context"
	"strings"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	authv1 "k8s.io/api/authorization/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/klog/v2"
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
	internalProxiedK8SClient kubernetes.Interface,
) {
	go func() {
		time.Sleep(5 * time.Second)
		go m.updateUsersMetric(internalProxiedK8SClient)
	}()

	ticker := time.NewTicker(updateConsoleUsersInterval)
	quit := make(chan struct{})
	go func() {
		for {
			select {
			case <-ticker.C:
				m.updateUsersMetric(internalProxiedK8SClient)
			case <-quit:
				ticker.Stop()
				return
			}
		}
	}()
}

func sarWithRetry(client kubernetes.Interface, sar *authv1.SubjectAccessReview, maxRetries int) (*authv1.SubjectAccessReview, error) {
	ctx := context.TODO()
	var lastErr error

	for i := 0; i < maxRetries; i++ {
		res, err := client.AuthorizationV1().SubjectAccessReviews().Create(ctx, sar, metav1.CreateOptions{})
		if err == nil {
			return res, nil
		}
		lastErr = err

		if i < maxRetries-1 {
			backoffDuration := time.Duration(i+1) * 100 * time.Millisecond
			klog.V(4).Infof("SAR retry %d/%d failed, retrying in %v: %v", i+1, maxRetries, backoffDuration, err)
			time.Sleep(backoffDuration)
		}
	}
	return nil, lastErr
}

func (m *Metrics) classifyUsers(client kubernetes.Interface, userNames []string) map[string]UserRole {
	if len(userNames) == 0 {
		return make(map[string]UserRole)
	}

	results := make(map[string]UserRole)
	for _, userName := range userNames {
		time.Sleep(delayBetweenConsoleUserPermissionChecks)
		role := classifyUserRole(client, userName)
		results[userName] = role
	}

	return results
}

func classifyUserRole(client kubernetes.Interface, userName string) UserRole {
	if userName == "kube:admin" {
		return KubeadminUserRole
	}

	adminChecks := []authv1.ResourceAttributes{
		{Verb: "get", Resource: "nodes"},
		{Verb: "list", Resource: "clusteroperators", Group: "config.openshift.io"},
		{Verb: "create", Resource: "namespaces"},
		{Verb: "get", Resource: "namespaces"},
	}

	adminScore := 0
	totalChecks := 0

	for _, resourceAttr := range adminChecks {
		sar := &authv1.SubjectAccessReview{
			Spec: authv1.SubjectAccessReviewSpec{
				User:               userName,
				ResourceAttributes: &resourceAttr,
			},
		}

		res, err := sarWithRetry(client, sar, 3)
		if err != nil {
			klog.V(4).Infof("SAR check failed for %s on %s/%s after retries: %v", userName, resourceAttr.Resource, resourceAttr.Verb, err)
			continue
		}

		totalChecks++
		if res.Status.Allowed {
			adminScore++
		}
	}

	if totalChecks == 0 {
		return DeveloperUserRole
	}

	if float64(adminScore)/float64(totalChecks) >= 0.5 {
		return ClusterAdminUserRole
	}

	return DeveloperUserRole
}

func (m *Metrics) updateUsersMetric(internalProxiedK8SClient kubernetes.Interface) error {
	klog.Info("usage.Metrics: Count console users...\n")
	startTime := time.Now()

	ctx := context.TODO()

	roleBindingList, err := internalProxiedK8SClient.RbacV1().RoleBindings("openshift-console-user-settings").List(ctx, metav1.ListOptions{})
	if err != nil {
		klog.Errorf("usage.Metrics: Failed to get user-settings RoleBindings: %v\n", err)
		return err
	}

	var kubeAdmin, clusterAdmins, developers, unknowns int

	var validUserNames []string
	for _, roleBinding := range roleBindingList.Items {
		if !strings.HasPrefix(roleBinding.Name, "user-settings-") || !strings.HasSuffix(roleBinding.Name, "-rolebinding") {
			if klog.V(4).Enabled() {
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

		validUserNames = append(validUserNames, user.Name)
	}

	userRoles := m.classifyUsers(internalProxiedK8SClient, validUserNames)

	for userName, role := range userRoles {
		switch role {
		case KubeadminUserRole:
			if klog.V(4).Enabled() {
				klog.Infof("usage.Metrics: Count %q as %q...\n", userName, KubeadminUserRole)
			}
			kubeAdmin++
		case ClusterAdminUserRole:
			if klog.V(4).Enabled() && clusterAdmins < 10 {
				klog.Infof("usage.Metrics: Count %q as %q...\n", userName, ClusterAdminUserRole)
			}
			clusterAdmins++
		case DeveloperUserRole:
			if klog.V(4).Enabled() && developers < 10 {
				klog.Infof("usage.Metrics: Count %q as %q...\n", userName, DeveloperUserRole)
			}
			developers++
		default:
			klog.Errorf("usage.Metrics: Unexpected role %q for user %q\n", role, userName)
			unknowns++
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

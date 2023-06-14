package auth

import (
	"context"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	authv1 "k8s.io/api/authorization/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/klog"
)

var userResource = schema.GroupVersionResource{
	Group:    "user.openshift.io",
	Version:  "v1",
	Resource: "users",
}

type LoginRole string

const (
	KubeadminLoginRole    LoginRole = "kubeadmin"
	ClusterAdminLoginRole LoginRole = "cluster-admin"
	DeveloperLoginRole    LoginRole = "developer"
	UnknownLoginRole      LoginRole = "unknown"
)

type LoginFailureReason string

const (
	UnknownLoginFailureReason LoginFailureReason = "unknown"
)

type LogoutReason string

const (
	UnknownLogoutReason LogoutReason = "unknown"
)

type Metrics struct {
	loginRequests   prometheus.Counter
	loginSuccessful *prometheus.CounterVec
	loginFailures   *prometheus.CounterVec
	logoutRequests  *prometheus.CounterVec
}

func (m *Metrics) GetCollectors() []prometheus.Collector {
	return []prometheus.Collector{
		m.loginRequests,
		m.loginSuccessful,
		m.loginFailures,
		m.logoutRequests,
	}
}

func (m *Metrics) LoginRequested() {
	klog.V(4).Info("auth.Metrics LoginRequested\n")
	m.loginRequests.Inc()
}

func (m *Metrics) LoginSuccessful(k8sConfig *rest.Config, ls *loginState) {
	if k8sConfig == nil || ls == nil || len(ls.rawToken) == 0 {
		return
	}
	go func() {
		m.loginSuccessfulSync(k8sConfig, ls)
	}()
}

func (m *Metrics) loginSuccessfulSync(k8sConfig *rest.Config, ls *loginState) {
	if k8sConfig == nil || ls == nil || len(ls.rawToken) == 0 {
		return
	}

	ctx := context.TODO()
	configWithBearerToken := &rest.Config{
		Host:        k8sConfig.Host,
		Transport:   k8sConfig.Transport,
		BearerToken: ls.rawToken,
		Timeout:     30 * time.Second,
	}

	role := UnknownLoginRole

	if isKubeAdmin, err := m.isKubeAdmin(ctx, configWithBearerToken); isKubeAdmin && err == nil {
		role = KubeadminLoginRole
	} else if canGetNamespaces, err := m.canGetNamespaces(ctx, configWithBearerToken); err == nil {
		if canGetNamespaces {
			role = ClusterAdminLoginRole
		} else {
			role = DeveloperLoginRole
		}
	}

	klog.V(4).Infof("auth.Metrics loginSuccessfulSync - increase metric for role %q\n", role)
	counter, err := m.loginSuccessful.GetMetricWithLabelValues(string(role))
	if counter != nil && err == nil {
		counter.Inc()
	}
}

func (m *Metrics) LoginFailed(reason LoginFailureReason) {
	klog.V(4).Infof("auth.Metrics LoginFailed with reason %q\n", reason)
	counter, err := m.loginFailures.GetMetricWithLabelValues(string(reason))
	if counter != nil && err == nil {
		counter.Inc()
	}
}

func (m *Metrics) LogoutRequested(reason LogoutReason) {
	klog.V(4).Infof("auth.Metrics LogoutRequested with reason %q\n", reason)
	counter, err := m.logoutRequests.GetMetricWithLabelValues(string(reason))
	if counter != nil && err == nil {
		counter.Inc()
	}
}

func (m *Metrics) canGetNamespaces(ctx context.Context, config *rest.Config) (bool, error) {
	client, err := kubernetes.NewForConfig(config)
	if err != nil {
		klog.Errorf("Error in auth.metrics canGetNamespaces: %v\n", err)
		return false, err
	}
	canGetNamespaceAccessReview := &authv1.SelfSubjectAccessReview{
		Spec: authv1.SelfSubjectAccessReviewSpec{
			ResourceAttributes: &authv1.ResourceAttributes{
				Verb:     "get",
				Resource: "namespaces",
			},
		},
	}
	res, err := client.AuthorizationV1().SelfSubjectAccessReviews().Create(
		ctx,
		canGetNamespaceAccessReview,
		metav1.CreateOptions{},
	)
	if err != nil {
		klog.Errorf("Error in auth.metrics canGetNamespaces: %v\n", err)
		return false, err
	}
	return res.Status.Allowed, nil
}

func (m *Metrics) isKubeAdmin(ctx context.Context, config *rest.Config) (bool, error) {
	client, err := dynamic.NewForConfig(config)
	if err != nil {
		klog.Errorf("Error in auth.metrics isKubeAdmin: %v\n", err)
		return false, err
	}
	userInfo, err := client.Resource(userResource).Get(ctx, "~", metav1.GetOptions{})
	if err != nil {
		klog.Errorf("Error in auth.metrics isKubeAdmin: %v\n", err)
		return false, err
	}

	isKubeAdmin := userInfo.GetUID() == "" && userInfo.GetName() == "kube:admin"
	return isKubeAdmin, nil
}

func NewMetrics() *Metrics {
	m := new(Metrics)

	m.loginRequests = prometheus.NewCounter(prometheus.CounterOpts{
		Namespace: "console",
		Subsystem: "auth",
		Name:      "login_requests_total",
		Help:      "Total number of login requests from the frontend.",
	})

	m.loginSuccessful = prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace: "console",
		Subsystem: "auth",
		Name:      "login_successes_total",
		Help:      "Total number of successful logins. Role label is based on RBAC can list namespaces check.",
	}, []string{"role"})
	for _, role := range []LoginRole{KubeadminLoginRole, ClusterAdminLoginRole, DeveloperLoginRole} {
		m.loginSuccessful.GetMetricWithLabelValues(string(role))
	}

	m.loginFailures = prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace: "console",
		Subsystem: "auth",
		Name:      "login_failures_total",
		Help:      "Total number of login failures.",
	}, []string{"reason"})
	m.loginFailures.GetMetricWithLabelValues(string(UnknownLoginFailureReason))

	m.logoutRequests = prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace: "console",
		Subsystem: "auth",
		Name:      "logout_requests_total",
		Help:      "Total number of logout requests from the frontend.",
	}, []string{"reason"})
	m.logoutRequests.GetMetricWithLabelValues(string(UnknownLogoutReason))

	return m
}

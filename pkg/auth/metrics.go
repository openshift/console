package auth

import (
	"context"
	"time"

	"github.com/openshift/console/pkg/auth/sessions"
	"github.com/openshift/console/pkg/proxy"
	"github.com/prometheus/client_golang/prometheus"
	authv1 "k8s.io/api/authorization/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/klog/v2"
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
	loginRequests        prometheus.Counter
	loginSuccessful      *prometheus.CounterVec
	loginFailures        *prometheus.CounterVec
	logoutRequests       *prometheus.CounterVec
	tokenRefreshRequests *prometheus.CounterVec
	// internalproxyClientConfig *rest.Config
	// K8sProxyConfig            *proxy.Config
}

func (m *Metrics) GetCollectors() []prometheus.Collector {
	return []prometheus.Collector{
		m.loginRequests,
		m.loginSuccessful,
		m.loginFailures,
		m.logoutRequests,
		m.tokenRefreshRequests,
	}
}

func (m *Metrics) LoginRequested() {
	klog.V(4).Info("auth.Metrics LoginRequested\n")
	m.loginRequests.Inc()
}

func (m *Metrics) LoginSuccessful(k8sConfig *rest.Config, ls *sessions.LoginState) {
	if k8sConfig == nil || ls == nil || len(ls.AccessToken()) == 0 {
		return
	}
	go func() {
		m.loginSuccessfulSync(k8sConfig, ls)
	}()
}

func (m *Metrics) loginSuccessfulSync(k8sConfig *rest.Config, ls *sessions.LoginState) {
	if k8sConfig == nil || ls == nil || len(ls.AccessToken()) == 0 {
		return
	}

	// anonymousInternalProxiedK8SRT, err := rest.TransportFor(rest.AnonymousClientConfig(m.internalproxyClientConfig))
	// if err != nil {
	// 	klog.Errorf("Error in auth.metrics loginSuccessfulSync: %v\n", err)
	// 	return
	// }

	// func (m *Metrics) getConfig(token string) (*rest.Config, error) {
	// 	var tlsClientConfig rest.TLSClientConfig
	// 	if m.TLSClientConfig.InsecureSkipVerify {
	// 		// off-cluster mode
	// 		tlsClientConfig.Insecure = true
	// 	} else {
	// 		inCluster, err := rest.InClusterConfig()
	// 		if err != nil {
	// 			return nil, err
	// 		}
	// 		tlsClientConfig = inCluster.TLSClientConfig
	// 	}

	// 	return &rest.Config{
	// 		Host:            m.ClusterEndpoint.Host,
	// 		TLSClientConfig: tlsClientConfig,
	// 		BearerToken:     token,
	// 	}, nil
	// }

	tlsConfig := rest.CopyConfig(k8sConfig).TLSClientConfig
	tlsConfig.Insecure = true

	klog.Infof("auth.Metrics loginSuccessfulSync - k8sConfig: %s\n", k8sConfig)

	ctx := context.TODO()
	configWithBearerToken := &rest.Config{
		Host:            k8sConfig.Host,
		Transport:       k8sConfig.Transport,
		BearerToken:     ls.AccessToken(),
		Timeout:         30 * time.Second,
		TLSClientConfig: tlsConfig,
	}

	// anonClientConfig := &rest.Config{
	// 	Host:      m.K8sProxyConfig.Endpoint.String(),
	// 	Transport: anonymousInternalProxiedK8SRT,
	// }

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

type TokenRefreshHandledType string

const (
	TokenRefreshShortCircuit TokenRefreshHandledType = "short-circuit"
	TokenRefreshFull         TokenRefreshHandledType = "full"
	TokenRefreshUnknown      TokenRefreshHandledType = "unknown"
)

func (m *Metrics) TokenRefreshRequest(handled TokenRefreshHandledType) {
	counter, err := m.tokenRefreshRequests.GetMetricWithLabelValues(string(handled))
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
	userInfo, err := client.Resource(userResource).Get(ctx, "~", metav1.GetOptions{}) // FIXME: fix this for the world where the userapi does not exist
	if err != nil {
		klog.Errorf("Error in auth.metrics isKubeAdmin: %v\n", err)
		return false, err
	}

	isKubeAdmin := userInfo.GetUID() == "" && userInfo.GetName() == "kube:admin"
	return isKubeAdmin, nil
}

func NewMetrics(internalproxyClientConfig *rest.Config, K8sProxyConfig *proxy.Config) *Metrics {
	m := new(Metrics)
	// m.internalproxyClientConfig = internalproxyClientConfig
	// m.K8sProxyConfig = K8sProxyConfig

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

	m.tokenRefreshRequests = prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace: "console",
		Subsystem: "auth",
		Name:      "token_refresh_requests_total",
		Help:      "Total number of token refresh requests done in the backend",
	}, []string{"handling"})
	for _, handling := range []TokenRefreshHandledType{TokenRefreshShortCircuit, TokenRefreshFull, TokenRefreshUnknown} {
		m.tokenRefreshRequests.GetMetricWithLabelValues(string(handling))
	}

	return m
}

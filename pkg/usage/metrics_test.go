package usage

import (
	"fmt"
	"strings"
	"testing"

	authv1 "k8s.io/api/authorization/v1"
	rbac "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes/fake"
	clienttesting "k8s.io/client-go/testing"

	"github.com/openshift/console/pkg/metrics"
	"github.com/stretchr/testify/assert"
)

func init() {
	delayBetweenConsoleUserPermissionChecks = 0
}

func TestDefaultUsageMetrics(t *testing.T) {
	m := NewMetrics()
	assert.Equal(t,
		metrics.RemoveComments(`
		console_usage_total{event="page_impression",perspective="admin"} 0
		console_usage_total{event="page_impression",perspective="dev"} 0
		console_usage_total{event="page_view",perspective="admin"} 0
		console_usage_total{event="page_view",perspective="dev"} 0
		`),
		metrics.RemoveComments(metrics.FormatMetrics(m.GetCollectors()...)),
	)
}

func TestPageImpressionsAndViewsMetrics(t *testing.T) {
	m := NewMetrics()
	for i := 0; i < 1; i++ {
		assert.NoError(t, m.HandleUsage("page_impression", "admin"))
	}
	for i := 0; i < 2; i++ {
		assert.NoError(t, m.HandleUsage("page_impression", "dev"))
	}
	for i := 0; i < 3; i++ {
		assert.NoError(t, m.HandleUsage("page_view", "admin"))
	}
	for i := 0; i < 4; i++ {
		assert.NoError(t, m.HandleUsage("page_view", "dev"))
	}
	assert.Equal(t,
		metrics.RemoveComments(`
		console_usage_total{event="page_impression",perspective="admin"} 1
		console_usage_total{event="page_impression",perspective="dev"} 2
		console_usage_total{event="page_view",perspective="admin"} 3
		console_usage_total{event="page_view",perspective="dev"} 4
		`),
		metrics.RemoveComments(metrics.FormatMetrics(m.usageTotal)),
	)
}

func TestUsersMetricsRunningTwice(t *testing.T) {
	clusterAdminSARHandler := func(action clienttesting.Action) (handled bool, ret runtime.Object, err error) {
		if action.GetVerb() != "create" {
			return false, nil, nil
		}

		obj := action.(clienttesting.CreateAction).GetObject().(*authv1.SubjectAccessReview)

		objCopy := obj.DeepCopy()
		objCopy.Status.Allowed = strings.HasPrefix(obj.Spec.User, "clusteradmin")

		return true, objCopy, nil

	}

	testcases := []struct {
		name               string
		rolebindings       []*rbac.RoleBinding
		sarHandler         clienttesting.ReactionFunc
		rolebindingHandler clienttesting.ReactionFunc
		expectedMetrics    string
		metricsInit        func(m *Metrics)
		expectedError      string
	}{
		{
			name:         "get-rolebindings-fails",
			rolebindings: []*rbac.RoleBinding{},
			rolebindingHandler: func(action clienttesting.Action) (handled bool, ret runtime.Object, err error) {
				res := action.(clienttesting.ListAction).GetResource()
				return true, nil, apierrors.NewGenericServerResponse(404, "get", res.GroupResource(), "", "", 0, false)
			},
			expectedError:   "the server could not find the requested resource (get rolebindings.rbac.authorization.k8s.io)",
			expectedMetrics: "",
		},
		{
			name: "can get namespaces fails",
			rolebindings: []*rbac.RoleBinding{
				{
					ObjectMeta: v1.ObjectMeta{
						Name:      "user-settings-unknown-user-role-rolebinding",
						Namespace: "openshift-console-user-settings",
					},
					Subjects: []rbac.Subject{
						{
							Kind: "User",
							Name: "unknown-user-role",
						},
					},
				},
			},
			expectedMetrics: `
			console_usage_users{role="unknown"} 1
			`,
			sarHandler: func(action clienttesting.Action) (handled bool, ret runtime.Object, err error) {
				return true, nil, fmt.Errorf("haha, I'm not working today!")
			},
		},
		{
			name: "can get namespaces works",
			rolebindings: []*rbac.RoleBinding{
				{
					ObjectMeta: v1.ObjectMeta{
						Name:      "user-settings-clusteradmin-rolebinding",
						Namespace: "openshift-console-user-settings",
					},
					Subjects: []rbac.Subject{
						{
							Kind: "User",
							Name: "clusteradmin",
						},
					},
				},
			},
			sarHandler: clusterAdminSARHandler,
			metricsInit: func(m *Metrics) {
				m.updatedUserRoleOnce[UnknownUserRole] = true
			},
			expectedMetrics: `
			console_usage_users{role="cluster-admin"} 1
			console_usage_users{role="unknown"} 0
			`,
		},
		{
			name: "kubeadmin and two cluster admins and three developers",
			rolebindings: []*rbac.RoleBinding{
				{
					ObjectMeta: v1.ObjectMeta{
						Name:      "user-settings-kubeadmin-rolebinding",
						Namespace: "openshift-console-user-settings",
					},
					Subjects: []rbac.Subject{
						{
							Kind: "User",
							Name: "kube:admin",
						},
					},
				},
				{
					ObjectMeta: v1.ObjectMeta{
						Name:      "user-settings-clusteradmin1-rolebinding",
						Namespace: "openshift-console-user-settings",
					},
					Subjects: []rbac.Subject{
						{
							Kind: "User",
							Name: "clusteradmin1",
						},
					},
				},
				{
					ObjectMeta: v1.ObjectMeta{
						Name:      "user-settings-clusteradmin2-rolebinding",
						Namespace: "openshift-console-user-settings",
					},
					Subjects: []rbac.Subject{
						{
							Kind: "User",
							Name: "clusteradmin2",
						},
					},
				},
				{
					ObjectMeta: v1.ObjectMeta{
						Name:      "user-settings-developer1-rolebinding",
						Namespace: "openshift-console-user-settings",
					},
					Subjects: []rbac.Subject{
						{
							Kind: "User",
							Name: "developer1",
						},
					},
				},
				{
					ObjectMeta: v1.ObjectMeta{
						Name:      "user-settings-developer2-rolebinding",
						Namespace: "openshift-console-user-settings",
					},
					Subjects: []rbac.Subject{
						{
							Kind: "User",
							Name: "developer2",
						},
					},
				},
				{
					ObjectMeta: v1.ObjectMeta{
						Name:      "user-settings-developer3-rolebinding",
						Namespace: "openshift-console-user-settings",
					},
					Subjects: []rbac.Subject{
						{
							Kind: "User",
							Name: "developer3",
						},
					},
				},
				// This rolebinding with two subjects will be count as unknown
				{
					ObjectMeta: v1.ObjectMeta{
						Name:      "user-settings-both-developers-rolebinding",
						Namespace: "openshift-console-user-settings",
					},
					Subjects: []rbac.Subject{
						{
							Kind: "User",
							Name: "developer1",
						},
						{
							Kind: "User",
							Name: "developer2",
						},
					},
				},
				// This rolebinding with an unexpected resource name will be ignored
				{
					ObjectMeta: v1.ObjectMeta{
						Name:      "another-rolebinding",
						Namespace: "openshift-console-user-settings",
					},
					Subjects: []rbac.Subject{
						{
							Kind: "User",
							Name: "developer1",
						},
					},
				},
			},
			sarHandler: clusterAdminSARHandler,
			expectedMetrics: `
			console_usage_users{role="cluster-admin"} 2
			console_usage_users{role="developer"} 3
			console_usage_users{role="kubeadmin"} 1
			console_usage_users{role="unknown"} 1
			`,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			objs := []runtime.Object{}
			for _, rb := range testcase.rolebindings {
				objs = append(objs, rb)
			}
			client := fake.NewSimpleClientset(objs...)
			if testcase.rolebindingHandler != nil {
				client.PrependReactor("list", "rolebindings", testcase.rolebindingHandler)
			}
			if testcase.sarHandler != nil {
				client.PrependReactor("create", "subjectaccessreviews", testcase.sarHandler)
			}

			m := NewMetrics()
			if testcase.metricsInit != nil {
				testcase.metricsInit(m)
			}
			err := m.updateUsersMetric(client)
			if len(testcase.expectedError) > 0 {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), testcase.expectedError)
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t,
				metrics.RemoveComments(testcase.expectedMetrics),
				metrics.RemoveComments(metrics.FormatMetrics(m.users)),
			)

		})
	}
}

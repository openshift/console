package serverconfig

import (
	"testing"

	"github.com/openshift/console/pkg/metrics"
	"github.com/stretchr/testify/assert"
	v1 "k8s.io/api/authorization/v1"
)

func TestNoPluginMetrics(t *testing.T) {
	m := NewMetrics(&Config{
		Plugins: MultiKeyValue{},
	})
	assert.Equal(t,
		"",
		metrics.RemoveComments(metrics.FormatMetrics(m.pluginsInfo)),
	)
}

func TestPluginMetrics(t *testing.T) {
	m := NewMetrics(&Config{
		Plugins: MultiKeyValue{
			"plugin-a": "reference to installed plugin a",
			"plugin-b": "reference to installed plugin b",
		},
	})
	assert.Equal(t,
		metrics.RemoveComments(`
		console_plugins_info{name="plugin-a",state="enabled"} 1
		console_plugins_info{name="plugin-b",state="enabled"} 1
		`),
		metrics.RemoveComments(metrics.FormatMetrics(m.pluginsInfo)),
	)
}

func TestPerspectiveMetrics(t *testing.T) {
	testcases := []struct {
		name            string
		perspectives    []Perspective
		expectedMetrics string
	}{
		{
			name:            "no-perspective",
			perspectives:    []Perspective{},
			expectedMetrics: "",
		},

		{
			name: "ignore-enabled-default-perspective",
			perspectives: []Perspective{
				{
					ID: "admin",
				},
				{
					ID: "dev",
					Visibility: PerspectiveVisibility{
						State: PerspectiveEnabled,
					},
				},
			},
			expectedMetrics: "",
		},

		{
			name: "perspective-enabled",
			perspectives: []Perspective{
				{
					ID: "enabled-perspective",
					Visibility: PerspectiveVisibility{
						State: PerspectiveEnabled,
					},
				},
				{
					ID: "enabled-perspective-without-visibility",
				},
				{
					ID:         "enabled-perspective-without-state",
					Visibility: PerspectiveVisibility{},
				},
			},
			expectedMetrics: `
			console_customization_perspectives_info{name="enabled-perspective",state="enabled"} 1
			console_customization_perspectives_info{name="enabled-perspective-without-state",state="enabled"} 1
			console_customization_perspectives_info{name="enabled-perspective-without-visibility",state="enabled"} 1
			`,
		},

		{
			name: "perspective-disabled",
			perspectives: []Perspective{
				{
					ID: "disabled-perspective",
					Visibility: PerspectiveVisibility{
						State: PerspectiveDisabled,
					},
				},
			},
			expectedMetrics: `
			console_customization_perspectives_info{name="disabled-perspective",state="disabled"} 1
			`,
		},

		{
			name: "perspective-only-visible-for-cluster-admins",
			perspectives: []Perspective{
				{
					ID: "cluster-admin-perspective",
					Visibility: PerspectiveVisibility{
						State: PerspectiveAccessReview,
						AccessReview: &ResourceAttributesAccessReview{
							Required: []v1.ResourceAttributes{
								{
									Resource: "namespaces",
									Verb:     "get",
								},
							},
						},
					},
				},
			},
			expectedMetrics: `
			console_customization_perspectives_info{name="cluster-admin-perspective",state="only-for-cluster-admins"} 1
			`,
		},

		{
			name: "perspective-only-visible-for-developers",
			perspectives: []Perspective{
				{
					ID: "developer-perspective",
					Visibility: PerspectiveVisibility{
						State: PerspectiveAccessReview,
						AccessReview: &ResourceAttributesAccessReview{
							Missing: []v1.ResourceAttributes{
								{
									Resource: "namespaces",
									Verb:     "get",
								},
							},
						},
					},
				},
			},
			expectedMetrics: `
			console_customization_perspectives_info{name="developer-perspective",state="only-for-developers"} 1
			`,
		},

		{
			name: "perspective-with-custom-permissions",
			perspectives: []Perspective{
				{
					ID: "custom-permission-perspective",
					Visibility: PerspectiveVisibility{
						State: PerspectiveAccessReview,
						AccessReview: &ResourceAttributesAccessReview{
							Required: []v1.ResourceAttributes{
								{
									Resource: "configmaps",
									Verb:     "get",
								},
							},
						},
					},
				},
			},
			expectedMetrics: `
			console_customization_perspectives_info{name="custom-permission-perspective",state="custom-permissions"} 1
			`,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			config := &Config{
				Customization: Customization{
					Perspectives: testcase.perspectives,
				},
			}

			m := NewMetrics(config)
			assert.Equal(t,
				metrics.RemoveComments(testcase.expectedMetrics),
				metrics.RemoveComments(metrics.FormatMetrics(m.perspectivesInfo)),
			)
		})
	}
}

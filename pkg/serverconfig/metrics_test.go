package serverconfig

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/openshift/console/pkg/metrics"
	"github.com/stretchr/testify/assert"
	authv1 "k8s.io/api/authorization/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func createPluginConfiguration(pluginNames []string) *Config {
	config := &Config{}
	if pluginNames != nil {
		config.Plugins = MultiKeyValue{}
		for _, pluginName := range pluginNames {
			config.Plugins[pluginName] = fmt.Sprintf("https://%s-mock-endpoint", pluginName)
		}
	}
	return config
}

func createConsolePluginList(pluginNames []string) *v1.PartialObjectMetadataList {
	consolePlugins := &v1.PartialObjectMetadataList{
		TypeMeta: v1.TypeMeta{
			Kind: "List",
		},
		Items: []v1.PartialObjectMetadata{},
	}
	for _, pluginName := range pluginNames {
		consolePlugins.Items = append(consolePlugins.Items, v1.PartialObjectMetadata{
			TypeMeta: v1.TypeMeta{
				APIVersion: "console.openshift.io/v1",
				Kind:       "ConsolePlugin",
			},
			ObjectMeta: v1.ObjectMeta{
				Name: pluginName,
			},
		})
	}
	return consolePlugins
}

func TestPluginMetrics(t *testing.T) {
	testcases := []struct {
		name              string
		configuredPlugins []string
		consolePlugins    []string
		expectedMetrics   string
	}{
		{
			name:              "nil-plugins",
			configuredPlugins: nil,
			consolePlugins:    nil,
			expectedMetrics:   "",
		},

		{
			name:              "empty-plugins",
			configuredPlugins: []string{},
			consolePlugins:    []string{},
			expectedMetrics:   "",
		},

		{
			name:              "well-known-ConsolePlugins",
			configuredPlugins: []string{"acm", "kubevirt-plugin", "my-plugin"},
			consolePlugins:    []string{"acm", "kubevirt-plugin", "my-plugin"},
			expectedMetrics: `
			console_plugins_info{name="demo",state="enabled"} 1
			console_plugins_info{name="redhat",state="enabled"} 2
			`,
		},

		{
			// existing ConsolePlugin resource, and part of the console config
			name:              "enabled-plugins",
			configuredPlugins: []string{"an-enabled-plugin", "another-enabled-plugin"},
			consolePlugins:    []string{"an-enabled-plugin", "another-enabled-plugin"},
			expectedMetrics: `
			console_plugins_info{name="other",state="enabled"} 2
			`,
		},

		{
			// existing ConsolePlugin resource, but not part of the console config
			name:              "disabled-plugins",
			configuredPlugins: []string{},
			consolePlugins:    []string{"a-disabed-plugin", "another-disabed-plugin"},
			expectedMetrics: `
			console_plugins_info{name="other",state="disabled"} 2
			`,
		},

		{
			// configured console config, but there is no ConsolePlugin resource
			name:              "notfound-plugins",
			configuredPlugins: []string{"a-missing-plugin", "another-missing-plugin"},
			consolePlugins:    []string{},
			expectedMetrics: `
			console_plugins_info{name="other",state="notfound"} 2
			`,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			configuredPlugins := createPluginConfiguration(testcase.configuredPlugins)
			consolePlugins := createConsolePluginList(testcase.consolePlugins)

			testserver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("Mock testserver handles: %s\n", r.URL.Path)
				if r.URL.Path == "/apis/console.openshift.io/v1/consoleplugins" {
					w.Header().Set("Content-Type", "application/json")

					if res, err := json.Marshal(consolePlugins); err != nil {
						w.WriteHeader(http.StatusInternalServerError)
						w.Write([]byte(err.Error()))
					} else {
						w.WriteHeader(http.StatusOK)
						w.Write(res)
					}
				} else {
					w.WriteHeader(http.StatusNotFound)
				}
			}))
			defer testserver.Close()

			m := NewMetrics(configuredPlugins)
			m.updatePluginMetric(&http.Client{}, testserver.URL, "ignored-service-account-token")

			assert.Equal(t,
				metrics.RemoveComments(testcase.expectedMetrics),
				metrics.RemoveComments(metrics.FormatMetrics(m.pluginsInfo)),
			)
		})
	}
}

func TestPluginMetricsRunningTwice(t *testing.T) {
	testcases := []struct {
		name                       string
		configuredPlugins          []string
		consolePluginsInitially    []string
		consolePluginsUpdated      []string
		expectedMetricsInitially   string
		expectedMetricsAfterUpdate string
	}{
		{
			name:                    "well-known-ConsolePlugins-are-removed",
			configuredPlugins:       []string{"acm", "kubevirt-plugin", "my-plugin"},
			consolePluginsInitially: []string{"acm", "kubevirt-plugin", "my-plugin"},
			consolePluginsUpdated:   []string{},
			expectedMetricsInitially: `
			console_plugins_info{name="demo",state="enabled"} 1
			console_plugins_info{name="redhat",state="enabled"} 2
			`,
			expectedMetricsAfterUpdate: `
			console_plugins_info{name="demo",state="enabled"} 0
			console_plugins_info{name="demo",state="notfound"} 1
			console_plugins_info{name="redhat",state="enabled"} 0
			console_plugins_info{name="redhat",state="notfound"} 2
			`,
		},

		{
			name:                    "one-enabled-plugin-is-removed",
			configuredPlugins:       []string{"an-enabled-plugin", "another-enabled-plugin"},
			consolePluginsInitially: []string{"an-enabled-plugin", "another-enabled-plugin"},
			consolePluginsUpdated:   []string{"an-enabled-plugin"},
			expectedMetricsInitially: `
			console_plugins_info{name="other",state="enabled"} 2
			`,
			expectedMetricsAfterUpdate: `
			console_plugins_info{name="other",state="enabled"} 1
			console_plugins_info{name="other",state="notfound"} 1
			`,
		},

		{
			name:                    "one-disabled-plugin-is-removed",
			configuredPlugins:       []string{},
			consolePluginsInitially: []string{"a-disabed-plugin", "another-disabed-plugin"},
			consolePluginsUpdated:   []string{"a-disabed-plugin"},
			expectedMetricsInitially: `
			console_plugins_info{name="other",state="disabled"} 2
			`,
			expectedMetricsAfterUpdate: `
			console_plugins_info{name="other",state="disabled"} 1
			`,
		},

		{
			name:                    "one-notfound-plugin-is-installed",
			configuredPlugins:       []string{"a-missing-plugin", "another-plugin"},
			consolePluginsInitially: []string{},
			consolePluginsUpdated:   []string{"another-plugin"},
			expectedMetricsInitially: `
			console_plugins_info{name="other",state="notfound"} 2
			`,
			expectedMetricsAfterUpdate: `
			console_plugins_info{name="other",state="enabled"} 1
			console_plugins_info{name="other",state="notfound"} 1
			`,
		},

		{
			name:                    "plugins-are-installed",
			configuredPlugins:       []string{"an-first-enabled-plugin", "acm"},
			consolePluginsInitially: []string{"an-first-enabled-plugin", "acm", "another-disabled-plugin"},
			consolePluginsUpdated:   []string{"another-disabled-plugin", "acm", "my-plugin"},
			expectedMetricsInitially: `
			console_plugins_info{name="other",state="disabled"} 1
			console_plugins_info{name="other",state="enabled"} 1
			console_plugins_info{name="redhat",state="enabled"} 1
			`,
			expectedMetricsAfterUpdate: `
			console_plugins_info{name="demo",state="disabled"} 1
			console_plugins_info{name="other",state="disabled"} 1
			console_plugins_info{name="other",state="enabled"} 0
			console_plugins_info{name="other",state="notfound"} 1
			console_plugins_info{name="redhat",state="enabled"} 1
			`,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			configuredPlugins := createPluginConfiguration(testcase.configuredPlugins)
			consolePluginsInitially := createConsolePluginList(testcase.consolePluginsInitially)
			consolePluginsUpdated := createConsolePluginList(testcase.consolePluginsUpdated)

			m := NewMetrics(configuredPlugins)
			{
				testserver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					fmt.Printf("Mock testserver handles: %s\n", r.URL.Path)
					if r.URL.Path == "/apis/console.openshift.io/v1/consoleplugins" {
						w.Header().Set("Content-Type", "application/json")

						if res, err := json.Marshal(consolePluginsInitially); err != nil {
							w.WriteHeader(http.StatusInternalServerError)
							w.Write([]byte(err.Error()))
						} else {
							w.WriteHeader(http.StatusOK)
							w.Write(res)
						}
					} else {
						w.WriteHeader(http.StatusNotFound)
					}
				}))
				defer testserver.Close()
				m.updatePluginMetric(&http.Client{}, testserver.URL, "ignored-service-account-token")
			}
			assert.Equal(t,
				metrics.RemoveComments(testcase.expectedMetricsInitially),
				metrics.RemoveComments(metrics.FormatMetrics(m.pluginsInfo)),
			)

			{
				testserver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					fmt.Printf("Mock testserver handles: %s\n", r.URL.Path)
					if r.URL.Path == "/apis/console.openshift.io/v1/consoleplugins" {
						w.Header().Set("Content-Type", "application/json")

						if res, err := json.Marshal(consolePluginsUpdated); err != nil {
							w.WriteHeader(http.StatusInternalServerError)
							w.Write([]byte(err.Error()))
						} else {
							w.WriteHeader(http.StatusOK)
							w.Write(res)
						}
					} else {
						w.WriteHeader(http.StatusNotFound)
					}
				}))
				defer testserver.Close()
				m.updatePluginMetric(&http.Client{}, testserver.URL, "ignored-service-account-token")
			}
			assert.Equal(t,
				metrics.RemoveComments(testcase.expectedMetricsAfterUpdate),
				metrics.RemoveComments(metrics.FormatMetrics(m.pluginsInfo)),
			)
		})
	}
}

func TestPerspectiveMetrics(t *testing.T) {
	testcases := []struct {
		name            string
		perspectives    []Perspective
		expectedMetrics string
	}{
		{
			name:            "nil-perspective",
			perspectives:    nil,
			expectedMetrics: "",
		},

		{
			name:            "empty-perspective",
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
			console_customization_perspectives_info{name="other",state="enabled"} 3
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
				{
					ID: "another-disabled-perspective",
					Visibility: PerspectiveVisibility{
						State: PerspectiveDisabled,
					},
				},
			},
			expectedMetrics: `
			console_customization_perspectives_info{name="other",state="disabled"} 2
			`,
		},

		{
			name: "perspective-only-visible-for-cluster-admins",
			perspectives: []Perspective{
				{
					ID: "admin",
					Visibility: PerspectiveVisibility{
						State: PerspectiveAccessReview,
						AccessReview: &ResourceAttributesAccessReview{
							Required: []authv1.ResourceAttributes{
								{
									Resource: "namespaces",
									Verb:     "get",
								},
							},
						},
					},
				},
				{
					ID: "another-admin-perspective",
					Visibility: PerspectiveVisibility{
						State: PerspectiveAccessReview,
						AccessReview: &ResourceAttributesAccessReview{
							Required: []authv1.ResourceAttributes{
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
			console_customization_perspectives_info{name="admin",state="only-for-cluster-admins"} 1
			console_customization_perspectives_info{name="other",state="only-for-cluster-admins"} 1
			`,
		},

		{
			name: "perspective-only-visible-for-developers",
			perspectives: []Perspective{
				{
					ID: "dev",
					Visibility: PerspectiveVisibility{
						State: PerspectiveAccessReview,
						AccessReview: &ResourceAttributesAccessReview{
							Missing: []authv1.ResourceAttributes{
								{
									Resource: "namespaces",
									Verb:     "get",
								},
							},
						},
					},
				},
				{
					ID: "another-dev-perspective",
					Visibility: PerspectiveVisibility{
						State: PerspectiveAccessReview,
						AccessReview: &ResourceAttributesAccessReview{
							Missing: []authv1.ResourceAttributes{
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
			console_customization_perspectives_info{name="dev",state="only-for-developers"} 1
			console_customization_perspectives_info{name="other",state="only-for-developers"} 1
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
							Required: []authv1.ResourceAttributes{
								{
									Resource: "configmaps",
									Verb:     "get",
								},
							},
						},
					},
				},
				{
					ID: "another-custom-permission-perspective",
					Visibility: PerspectiveVisibility{
						State: PerspectiveAccessReview,
						AccessReview: &ResourceAttributesAccessReview{
							Required: []authv1.ResourceAttributes{
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
			console_customization_perspectives_info{name="other",state="custom-permissions"} 2
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

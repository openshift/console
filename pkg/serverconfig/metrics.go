package serverconfig

import (
	"github.com/prometheus/client_golang/prometheus"
)

type Metrics struct {
	pluginsInfo      *prometheus.GaugeVec
	perspectivesInfo *prometheus.GaugeVec
}

type PerspectiveMetricState string

const (
	PerspectiveMetricStateEnabled              PerspectiveMetricState = "enabled"
	PerspectiveMetricStateDisabled             PerspectiveMetricState = "disabled"
	PerspectiveMetricStateOnlyForClusterAdmins PerspectiveMetricState = "only-for-cluster-admins"
	PerspectiveMetricStateOnlyForDevelopers    PerspectiveMetricState = "only-for-developers"
	PerspectiveMetricStateCustomPermissions    PerspectiveMetricState = "custom-permissions"
)

func (m *Metrics) GetCollectors() []prometheus.Collector {
	return []prometheus.Collector{
		m.pluginsInfo,
		m.perspectivesInfo,
	}
}

func NewMetrics(config *Config) *Metrics {
	m := new(Metrics)

	m.pluginsInfo = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: "console",
		Subsystem: "plugins",
		Name:      "info",
		Help:      "List all plugins with their name and state as label. State is currently always enabled. Reports 1 for each plugin (per console pod instance).",
	}, []string{"name", "state"})
	if config != nil && config.Plugins != nil {
		for name, _ := range config.Plugins {
			m.pluginsInfo.WithLabelValues(name, "enabled").Inc()
		}
	}

	m.perspectivesInfo = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: "console",
		Subsystem: "customization_perspectives",
		Name:      "info",
		Help:      "List of customized perspectives, for example perspective=dev with state=disabled and 1 as metric.",
	}, []string{"name", "state"})
	if config != nil && config.Customization.Perspectives != nil {
		for _, perspective := range config.Customization.Perspectives {
			switch perspective.Visibility.State {
			default:
				if perspective.ID != "admin" && perspective.ID != "dev" {
					m.perspectivesInfo.WithLabelValues(perspective.ID, string(PerspectiveMetricStateEnabled)).Inc()
				}
			case PerspectiveDisabled:
				m.perspectivesInfo.WithLabelValues(perspective.ID, string(PerspectiveMetricStateDisabled)).Inc()
			case PerspectiveAccessReview:
				if perspective.Visibility.AccessReview != nil {
					required := perspective.Visibility.AccessReview.Required
					missing := perspective.Visibility.AccessReview.Missing
					if len(required) == 1 && len(missing) == 0 && required[0].Resource == "namespaces" && required[0].Verb == "get" {
						m.perspectivesInfo.WithLabelValues(perspective.ID, string(PerspectiveMetricStateOnlyForClusterAdmins)).Inc()
					} else if len(required) == 0 && len(missing) == 1 && missing[0].Resource == "namespaces" && missing[0].Verb == "get" {
						m.perspectivesInfo.WithLabelValues(perspective.ID, string(PerspectiveMetricStateOnlyForDevelopers)).Inc()
					} else {
						m.perspectivesInfo.WithLabelValues(perspective.ID, string(PerspectiveMetricStateCustomPermissions)).Inc()
					}
				}
			}
		}
	}

	return m
}

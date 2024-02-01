package serverconfig

import (
	"context"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/klog"
)

// We don't expect that the plugin metrics changes regularly (without a new console rollout).
const updateConsolePluginInterval = 6 * time.Hour

var consolePluginResource = schema.GroupVersionResource{
	Group:    "console.openshift.io",
	Version:  "v1",
	Resource: "consoleplugins",
}

type Metrics struct {
	config           *Config
	perspectivesInfo *prometheus.GaugeVec
	pluginsInfo      *prometheus.GaugeVec
	// Keep the last info so that it is possible to report zero for removed ConsolePlugins.
	lastPluginInfo *map[MappedPluginName]map[PluginState]int
}

// Reduce cardinality by grouping all perspectives by a 'group name'.
type PerspectiveGroup string

const (
	// Seperate admin, dev and acm.
	PerspectiveGroupAdmin PerspectiveGroup = "admin"
	PerspectiveGroupDev   PerspectiveGroup = "dev"
	PerspectiveGroupACM   PerspectiveGroup = "acm"
	PerspectiveGroupOther PerspectiveGroup = "other"
)

var knownPerspectiveIDs = map[string]PerspectiveGroup{
	"admin": PerspectiveGroupAdmin,
	"dev":   PerspectiveGroupDev,
	"acm":   PerspectiveGroupACM,
}

type PerspectiveMetricState string

const (
	PerspectiveMetricStateEnabled              PerspectiveMetricState = "enabled"
	PerspectiveMetricStateDisabled             PerspectiveMetricState = "disabled"
	PerspectiveMetricStateOnlyForClusterAdmins PerspectiveMetricState = "only-for-cluster-admins"
	PerspectiveMetricStateOnlyForDevelopers    PerspectiveMetricState = "only-for-developers"
	PerspectiveMetricStateCustomPermissions    PerspectiveMetricState = "custom-permissions"
)

// Reduce cardinality by mapping known plugin names, everything else is reported as "unknown".
type MappedPluginName string

var knownPluginNames = map[string]MappedPluginName{
	// Red Hat maintained plugins
	// https://docs.google.com/spreadsheets/d/1wcCdc1s4ewzxtUJ42VdRhAJ9wFA8UwoTajGSftrr5fM/edit
	"acm":                             "acm",
	"console-telemetry-plugin":        "telemetry",
	"crane-ui-plugin":                 "crane",
	"forklift-console-plugin":         "forklift",
	"gitops-plugin":                   "gitops",
	"kubevirt-plugin":                 "kubevirt",
	"logging-view-plugin":             "logging-view",
	"mce":                             "mce",
	"monitoring-plugin":               "monitoring",
	"netobserv-plugin":                "netobserv",
	"nmstate-console-plugin":          "nmstate",
	"node-remediation-console-plugin": "node-remediation",
	"odf-console":                     "odf",
	"odf-multicluster-console":        "odf-multicluster",
	"pipeline-console-plugin":         "pipelines",

	// Unchanged template name from https://github.com/openshift/console-plugin-template
	"console-plugin-template": "demo",
	"my-plugin":               "demo",
}

type PluginState string

const (
	// existing ConsolePlugin resource, and part of the console config
	PluginStateEnabled PluginState = "enabled"
	// existing ConsolePlugin resource, but not part of the console config
	PluginStateDisabled PluginState = "disabled"
	// configured console config, but there is no ConsolePlugin resource
	PluginStateNotFound PluginState = "notfound"
)

func (m *Metrics) GetCollectors() []prometheus.Collector {
	return []prometheus.Collector{
		m.perspectivesInfo,
		m.pluginsInfo,
	}
}

func (m *Metrics) MonitorPlugins(dynamicClient dynamic.Interface) {
	go func() {
		time.Sleep(3 * time.Second)
		go m.updatePluginMetric(dynamicClient)
	}()

	ticker := time.NewTicker(updateConsolePluginInterval)
	quit := make(chan struct{})
	go func() {
		for {
			select {
			case <-ticker.C:
				m.updatePluginMetric(dynamicClient)
			case <-quit:
				ticker.Stop()
				return
			}
		}
	}()
}

// ConsolePlugins are monitored with a slow interval (see updateConsolePluginInterval).
// So this gauge can go up and down and it is required to set missing values to 0.
func (m *Metrics) updatePluginMetric(dynamicClient dynamic.Interface) {
	klog.Info("serverconfig.Metrics: Update ConsolePlugin metrics...\n")
	startTime := time.Now()

	consolePlugins, err := m.getConsolePlugins(dynamicClient)
	if err != nil {
		klog.Errorf("serverconfig.Metrics: Failed to get all installed ConsolePlugins: %v\n", err)
	}

	pluginInfo := m.calculatePluginInfo(consolePlugins, m.lastPluginInfo)
	m.lastPluginInfo = pluginInfo
	klog.Infof("serverconfig.Metrics: Update ConsolePlugin metrics: %v (took %v)\n",
		pluginInfo,
		time.Since(startTime),
	)

	for mappedPluginName, states := range *pluginInfo {
		for state, value := range states {
			if gauge, err := m.pluginsInfo.GetMetricWithLabelValues(string(mappedPluginName), string(state)); gauge != nil && err == nil {
				gauge.Set(float64(value))
			}
		}
	}
}

func (m *Metrics) getConsolePlugins(dynamicClient dynamic.Interface) (*[]unstructured.Unstructured, error) {
	ctx := context.TODO() // FIXME: this is a wrong spot, the context should be wired through to this function

	resp, err := dynamicClient.Resource(consolePluginResource).List(ctx, v1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return &resp.Items, err
}

// Create a new plugin info map that is based on the last report to report also removed ConsolePlugins.
func (m *Metrics) calculatePluginInfo(
	consolePlugins *[]unstructured.Unstructured,
	lastPluginInfo *map[MappedPluginName]map[PluginState]int,
) *map[MappedPluginName]map[PluginState]int {
	pluginInfo := make(map[MappedPluginName]map[PluginState]int)

	if lastPluginInfo != nil {
		for lastPluginName, lastPluginStates := range *lastPluginInfo {
			for lastPluginState := range lastPluginStates {
				if pluginInfo[lastPluginName] == nil {
					pluginInfo[lastPluginName] = make(map[PluginState]int)
				}
				pluginInfo[lastPluginName][lastPluginState] = 0
			}
		}
	}

	consolePluginNames := make(map[string]bool)

	if consolePlugins != nil {
		for _, consolePlugin := range *consolePlugins {
			pluginName := consolePlugin.GetName()
			mappedPluginName := knownPluginNames[pluginName]
			if mappedPluginName == "" {
				mappedPluginName = "unknown"
			}
			state := PluginStateDisabled
			if m.config != nil && m.config.Plugins != nil {
				if _, found := m.config.Plugins[pluginName]; found {
					state = PluginStateEnabled
				}
			}
			if pluginInfo[mappedPluginName] == nil {
				pluginInfo[mappedPluginName] = make(map[PluginState]int)
			}
			pluginInfo[mappedPluginName][state]++
			consolePluginNames[pluginName] = true
		}
	}

	if m.config != nil && m.config.Plugins != nil {
		for pluginName := range m.config.Plugins {
			if found := consolePluginNames[pluginName]; !found {
				mappedPluginName := knownPluginNames[pluginName]
				if mappedPluginName == "" {
					mappedPluginName = "unknown"
				}
				state := PluginStateNotFound
				if pluginInfo[mappedPluginName] == nil {
					pluginInfo[mappedPluginName] = make(map[PluginState]int)
				}
				pluginInfo[mappedPluginName][state]++
			}
		}
	}

	return &pluginInfo
}

// The perspective configuration could not be changed at runtime.
// Everytime a new customization is applyied a new console will be rolled out.
// So this metric is just updated once and there is no need to reset it at the moment.
func (m *Metrics) increasePerspectiveInfo(perspectiveGroup PerspectiveGroup, state PerspectiveMetricState) {
	m.perspectivesInfo.WithLabelValues(string(perspectiveGroup), string(state)).Inc()
}

func NewMetrics(config *Config) *Metrics {
	m := new(Metrics)
	m.config = config

	m.pluginsInfo = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: "console",
		Subsystem: "plugins",
		Name:      "info",
		Help:      "List all plugins with their name and state as label. State is currently always enabled. Reports 1 for each plugin (per console pod instance).",
	}, []string{"name", "state"})

	m.perspectivesInfo = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: "console",
		Subsystem: "customization_perspectives",
		Name:      "info",
		Help:      "List of customized perspectives, for example perspective=dev with state=disabled and 1 as metric.",
	}, []string{"name", "state"})
	if config != nil && config.Customization.Perspectives != nil {
		for _, perspective := range config.Customization.Perspectives {
			perspectiveGroup, found := knownPerspectiveIDs[perspective.ID]
			if !found {
				perspectiveGroup = PerspectiveGroupOther
			}

			switch perspective.Visibility.State {
			case PerspectiveDisabled:
				m.increasePerspectiveInfo(perspectiveGroup, PerspectiveMetricStateDisabled)
			case PerspectiveAccessReview:
				if perspective.Visibility.AccessReview != nil {
					required := perspective.Visibility.AccessReview.Required
					missing := perspective.Visibility.AccessReview.Missing
					if len(required) == 1 && len(missing) == 0 && required[0].Resource == "namespaces" && required[0].Verb == "get" {
						m.increasePerspectiveInfo(perspectiveGroup, PerspectiveMetricStateOnlyForClusterAdmins)
					} else if len(required) == 0 && len(missing) == 1 && missing[0].Resource == "namespaces" && missing[0].Verb == "get" {
						m.increasePerspectiveInfo(perspectiveGroup, PerspectiveMetricStateOnlyForDevelopers)
					} else {
						m.increasePerspectiveInfo(perspectiveGroup, PerspectiveMetricStateCustomPermissions)
					}
				}
			default:
				if perspective.ID != "admin" && perspective.ID != "dev" && perspective.ID != "acm" {
					m.increasePerspectiveInfo(perspectiveGroup, PerspectiveMetricStateEnabled)
				}
			}
		}
	}

	return m
}

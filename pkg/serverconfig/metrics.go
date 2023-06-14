package serverconfig

import (
	"context"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
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
	lastPluginInfo *map[PluginVendor]map[PluginState]int
}

// Reduce cardinality by grouping all perspectives by a 'group name' or a vendor.
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

// Reduce cardinality by mapping known plugin names to a vendor name.
type PluginVendor string

const (
	PluginVendorRedHat PluginVendor = "redhat"
	PluginVendorDemo   PluginVendor = "demo"
	PluginVendorOther  PluginVendor = "other"
)

var knownPluginVendors = map[string]PluginVendor{
	// Red Hat maintained plugins
	// https://docs.google.com/spreadsheets/d/1wcCdc1s4ewzxtUJ42VdRhAJ9wFA8UwoTajGSftrr5fM/edit
	"acm":                             PluginVendorRedHat,
	"console-telemetry-plugin":        PluginVendorRedHat,
	"crane-ui-plugin":                 PluginVendorRedHat,
	"forklift-console-plugin":         PluginVendorRedHat,
	"kubevirt-plugin":                 PluginVendorRedHat,
	"logging-view-plugin":             PluginVendorRedHat,
	"mce":                             PluginVendorRedHat,
	"netobserv-plugin":                PluginVendorRedHat,
	"nmstate-console-plugin":          PluginVendorRedHat,
	"node-remediation-console-plugin": PluginVendorRedHat,
	"odf-console":                     PluginVendorRedHat,
	"odf-multicluster-console":        PluginVendorRedHat,

	// Unchanged template name from https://github.com/openshift/console-plugin-template
	"console-plugin-template": PluginVendorDemo,
	"my-plugin":               PluginVendorDemo,
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

func (m *Metrics) MonitorPlugins(
	userSettingsClient *http.Client,
	userSettingsEndpoint string,
	serviceAccountToken string,
) {
	go func() {
		time.Sleep(3 * time.Second)
		go m.updatePluginMetric(userSettingsClient, userSettingsEndpoint, serviceAccountToken)
	}()

	ticker := time.NewTicker(updateConsolePluginInterval)
	quit := make(chan struct{})
	go func() {
		for {
			select {
			case <-ticker.C:
				m.updatePluginMetric(userSettingsClient, userSettingsEndpoint, serviceAccountToken)
			case <-quit:
				ticker.Stop()
				return
			}
		}
	}()
}

// ConsolePlugins are monitored with a slow interval (see updateConsolePluginInterval).
// So this gauge can go up and down and it is required to set missing values to 0.
func (m *Metrics) updatePluginMetric(
	k8sClient *http.Client,
	k8sEndpoint string,
	serviceAccountToken string,
) {
	klog.Info("serverconfig.Metrics: Update ConsolePlugin metrics...\n")
	startTime := time.Now()

	consolePlugins, err := m.getConsolePlugins(k8sClient, k8sEndpoint, serviceAccountToken)
	if err != nil {
		klog.Errorf("serverconfig.Metrics: Failed to get all installed ConsolePlugins: %v\n", err)
	}

	pluginInfo := m.calculatePluginInfo(consolePlugins, m.lastPluginInfo)
	m.lastPluginInfo = pluginInfo
	klog.Infof("serverconfig.Metrics: Update ConsolePlugin metrics: %v (took %v)\n",
		pluginInfo,
		time.Since(startTime),
	)

	for vendor, states := range *pluginInfo {
		for state, value := range states {
			if gauge, err := m.pluginsInfo.GetMetricWithLabelValues(string(vendor), string(state)); gauge != nil && err == nil {
				gauge.Set(float64(value))
			}
		}
	}
}

func (m *Metrics) getConsolePlugins(
	k8sClient *http.Client,
	k8sEndpoint string,
	serviceAccountToken string,
) (*[]unstructured.Unstructured, error) {
	ctx := context.TODO()
	config := &rest.Config{
		Transport:   k8sClient.Transport,
		Host:        k8sEndpoint,
		BearerToken: serviceAccountToken,
	}
	client, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, err
	}
	resp, err := client.Resource(consolePluginResource).List(ctx, v1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return &resp.Items, err
}

// Create a new plugin info map that is based on the last report to report also removed ConsolePlugins.
func (m *Metrics) calculatePluginInfo(
	consolePlugins *[]unstructured.Unstructured,
	lastPluginInfo *map[PluginVendor]map[PluginState]int,
) *map[PluginVendor]map[PluginState]int {
	pluginInfo := make(map[PluginVendor]map[PluginState]int)

	if lastPluginInfo != nil {
		for lastPluginVendor, lastPluginStates := range *lastPluginInfo {
			for lastPluginState := range lastPluginStates {
				if pluginInfo[lastPluginVendor] == nil {
					pluginInfo[lastPluginVendor] = make(map[PluginState]int)
				}
				pluginInfo[lastPluginVendor][lastPluginState] = 0
			}
		}
	}

	consolePluginNames := make(map[string]bool)

	if consolePlugins != nil {
		for _, consolePlugin := range *consolePlugins {
			pluginName := consolePlugin.GetName()
			vendor := knownPluginVendors[pluginName]
			if vendor == "" {
				vendor = PluginVendorOther
			}
			state := PluginStateDisabled
			if m.config != nil && m.config.Plugins != nil {
				if _, found := m.config.Plugins[pluginName]; found {
					state = PluginStateEnabled
				}
			}
			if pluginInfo[vendor] == nil {
				pluginInfo[vendor] = make(map[PluginState]int)
			}
			pluginInfo[vendor][state]++
			consolePluginNames[pluginName] = true
		}
	}

	if m.config != nil && m.config.Plugins != nil {
		for pluginName := range m.config.Plugins {
			if found := consolePluginNames[pluginName]; !found {
				vendor := knownPluginVendors[pluginName]
				if vendor == "" {
					vendor = PluginVendorOther
				}
				state := PluginStateNotFound
				if pluginInfo[vendor] == nil {
					pluginInfo[vendor] = make(map[PluginState]int)
				}
				pluginInfo[vendor][state]++
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

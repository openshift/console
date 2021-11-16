package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"k8s.io/klog/v2"
)

const (
	consoleHelmInstallsTotalMetric   = "console_helm_installs_total"
	consoleHelmUpgradesTotalMetric   = "console_helm_upgrades_total"
	consoleHelmUninstallsTotalMetric = "console_helm_uninstalls_total"

	consoleHelmChartNameLabel    = "chart_name"
	consoleHelmChartVersionLabel = "chart_version"
)

var (
	consoleHelmInstallsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: consoleHelmInstallsTotalMetric,
			Help: "Number of Helm installations from console by chart name and version.",
		},
		[]string{consoleHelmChartNameLabel, consoleHelmChartVersionLabel},
	)
	consoleHelmUpgradesTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: consoleHelmUpgradesTotalMetric,
			Help: "Number of Helm release upgrades from console by chart name and version.",
		},
		[]string{consoleHelmChartNameLabel, consoleHelmChartVersionLabel},
	)
	consoleHelmUninstallsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: consoleHelmUninstallsTotalMetric,
			Help: "Number of Helm release uninstallations from console by chart name and version.",
		},
		[]string{consoleHelmChartNameLabel, consoleHelmChartVersionLabel},
	)
)

func init() {
	prometheus.MustRegister(consoleHelmInstallsTotal)
	prometheus.MustRegister(consoleHelmUpgradesTotal)
	prometheus.MustRegister(consoleHelmUninstallsTotal)
}

func HandleconsoleHelmInstallsTotal(chartName, chartVersion string) {
	klog.V(4).Infof("metric %s: %s %s", consoleHelmInstallsTotalMetric, chartName, chartVersion)
	counter, err := consoleHelmInstallsTotal.GetMetricWithLabelValues(chartName, chartVersion)
	if err != nil {
		klog.Errorf("Recovering from metric function - %v", err)
		return
	}
	counter.Add(1)
}

func HandleconsoleHelmUpgradesTotal(chartName, chartVersion string) {
	klog.V(4).Infof("metric %s: %s %s", consoleHelmUpgradesTotalMetric, chartName, chartVersion)
	counter, err := consoleHelmUpgradesTotal.GetMetricWithLabelValues(chartName, chartVersion)
	if err != nil {
		klog.Errorf("Recovering from metric function - %v", err)
		return
	}
	counter.Add(1)
}

func HandleconsoleHelmUninstallsTotal(chartName, chartVersion string) {
	klog.V(4).Infof("metric %s: %s %s", consoleHelmUninstallsTotalMetric, chartName, chartVersion)
	counter, err := consoleHelmUninstallsTotal.GetMetricWithLabelValues(chartName, chartVersion)
	if err != nil {
		klog.Errorf("Recovering from metric function - %v", err)
		return
	}
	counter.Add(1)
}

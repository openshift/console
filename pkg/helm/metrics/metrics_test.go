package metrics

import (
	"bufio"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func TestMetricsNoRelease(t *testing.T) {
	consoleHelmInstallsTotal.Reset()
	consoleHelmUpgradesTotal.Reset()
	consoleHelmUninstallsTotal.Reset()
	ts := httptest.NewServer(promhttp.Handler())
	defer ts.Close()

	count := countMetric(t, ts, consoleHelmInstallsTotalMetric)
	if count > 0 {
		t.Errorf("%s should not be available", consoleHelmInstallsTotalMetric)
	}

	count = countMetric(t, ts, consoleHelmUpgradesTotalMetric)
	if count > 0 {
		t.Errorf("%s should not be available", consoleHelmUpgradesTotalMetric)
	}

	count = countMetric(t, ts, consoleHelmUninstallsTotalMetric)
	if count > 0 {
		t.Errorf("%s should not be available", consoleHelmUninstallsTotalMetric)
	}
}

func TestMetricsSingleRelease(t *testing.T) {
	consoleHelmInstallsTotal.Reset()
	consoleHelmUpgradesTotal.Reset()
	consoleHelmUninstallsTotal.Reset()
	ts := httptest.NewServer(promhttp.Handler())
	defer ts.Close()

	chartName, chartVersion := "test-chart", "0.0.1"
	chartNameLabel, chartVersionLabel := fmt.Sprintf("%s=\"%v\"", consoleHelmChartNameLabel, chartName), fmt.Sprintf("%s=\"%v\"", consoleHelmChartVersionLabel, chartVersion)
	HandleconsoleHelmInstallsTotal(chartName, chartVersion)
	HandleconsoleHelmUpgradesTotal(chartName, chartVersion)
	HandleconsoleHelmUninstallsTotal(chartName, chartVersion)

	count := countMetric(t, ts, consoleHelmInstallsTotalMetric, chartNameLabel, chartVersionLabel)
	if count != 1 {
		t.Errorf("%s with labels %s, %s should be 1: %v", consoleHelmInstallsTotalMetric, chartNameLabel, chartVersionLabel, count)
	}

	count = countMetric(t, ts, consoleHelmUpgradesTotalMetric, chartNameLabel, chartVersionLabel)
	if count != 1 {
		t.Errorf("%s with labels %s, %s should be 1: %v", consoleHelmUpgradesTotalMetric, chartNameLabel, chartVersionLabel, count)
	}

	count = countMetric(t, ts, consoleHelmUninstallsTotalMetric, chartNameLabel, chartVersionLabel)
	if count != 1 {
		t.Errorf("%s with labels %s, %s should be 1: %v", consoleHelmUninstallsTotalMetric, chartNameLabel, chartVersionLabel, count)
	}
}

func TestMetricsMultipleReleases(t *testing.T) {
	consoleHelmInstallsTotal.Reset()
	consoleHelmUpgradesTotal.Reset()
	consoleHelmUninstallsTotal.Reset()
	ts := httptest.NewServer(promhttp.Handler())
	defer ts.Close()

	chartName, chartVersion := "test-chart", "0.0.1"
	chartNameLabel, chartVersionLabel := fmt.Sprintf("%s=\"%v\"", consoleHelmChartNameLabel, chartName), fmt.Sprintf("%s=\"%v\"", consoleHelmChartVersionLabel, chartVersion)
	HandleconsoleHelmInstallsTotal(chartName, chartVersion)
	HandleconsoleHelmInstallsTotal(chartName, chartVersion)

	HandleconsoleHelmUpgradesTotal(chartName, chartVersion)
	HandleconsoleHelmUpgradesTotal(chartName, chartVersion)

	HandleconsoleHelmUninstallsTotal(chartName, chartVersion)
	HandleconsoleHelmUninstallsTotal(chartName, chartVersion)

	count := countMetric(t, ts, consoleHelmInstallsTotalMetric, chartNameLabel, chartVersionLabel)
	if count != 2 {
		t.Errorf("%s with labels %s, %s should be 2: %v", consoleHelmInstallsTotalMetric, chartNameLabel, chartVersionLabel, count)
	}

	count = countMetric(t, ts, consoleHelmUpgradesTotalMetric, chartNameLabel, chartVersionLabel)
	if count != 2 {
		t.Errorf("%s with labels %s, %s should be 2: %v", consoleHelmUpgradesTotalMetric, chartNameLabel, chartVersionLabel, count)
	}

	count = countMetric(t, ts, consoleHelmUninstallsTotalMetric, chartNameLabel, chartVersionLabel)
	if count != 2 {
		t.Errorf("%s with labels %s, %s should be 2: %v", consoleHelmUninstallsTotalMetric, chartNameLabel, chartVersionLabel, count)
	}

	chartName, chartVersion = "test-chart-2", "0.0.2"
	chartNameLabel, chartVersionLabel = fmt.Sprintf("%s=\"%v\"", consoleHelmChartNameLabel, chartName), fmt.Sprintf("%s=\"%v\"", consoleHelmChartVersionLabel, chartVersion)
	HandleconsoleHelmInstallsTotal(chartName, chartVersion)
	HandleconsoleHelmUpgradesTotal(chartName, chartVersion)
	HandleconsoleHelmUninstallsTotal(chartName, chartVersion)

	count = countMetric(t, ts, consoleHelmInstallsTotalMetric, chartNameLabel, chartVersionLabel)
	if count != 1 {
		t.Errorf("%s with labels %s, %s should be 1: %v", consoleHelmInstallsTotalMetric, chartNameLabel, chartVersionLabel, count)
	}

	count = countMetric(t, ts, consoleHelmUpgradesTotalMetric, chartNameLabel, chartVersionLabel)
	if count != 1 {
		t.Errorf("%s with labels %s, %s should be 1: %v", consoleHelmUpgradesTotalMetric, chartNameLabel, chartVersionLabel, count)
	}

	count = countMetric(t, ts, consoleHelmUninstallsTotalMetric, chartNameLabel, chartVersionLabel)
	if count != 1 {
		t.Errorf("%s with labels %s, %s should be 1: %v", consoleHelmUninstallsTotalMetric, chartNameLabel, chartVersionLabel, count)
	}

	// Metrics without specific labels
	count = countMetric(t, ts, consoleHelmInstallsTotalMetric)
	if count != 3 {
		t.Errorf("%s without labels should be 3: %v", consoleHelmInstallsTotalMetric, count)
	}

	count = countMetric(t, ts, consoleHelmUpgradesTotalMetric)
	if count != 3 {
		t.Errorf("%s without labels should be 3: %v", consoleHelmUpgradesTotalMetric, count)
	}

	count = countMetric(t, ts, consoleHelmUninstallsTotalMetric)
	if count != 3 {
		t.Errorf("%s without labels should be 3: %v", consoleHelmUninstallsTotalMetric, count)
	}
}

func getMetrics(t *testing.T, ts *httptest.Server) *http.Response {
	res, err := http.Get(ts.URL + "/metrics")
	if err != nil {
		t.Errorf("http error: %s", err)
	}

	if res.StatusCode != 200 {
		t.Errorf("http error: %d %s", res.StatusCode, http.StatusText(res.StatusCode))
	}
	return res
}

func countMetric(t *testing.T, ts *httptest.Server, metric string, labels ...string) int {
	res := getMetrics(t, ts)
	defer res.Body.Close()

	bytes, err := ioutil.ReadAll(res.Body)
	if err != nil {
		t.Fatalf("read error: %s", err)
	}

	return countMetricWithLabels(t, string(bytes), metric, labels...)
}

func countMetricWithLabels(t *testing.T, response, metric string, labels ...string) (count int) {
	scanner := bufio.NewScanner(strings.NewReader(response))
	for scanner.Scan() {
		text := scanner.Text()
		// skip comments
		if strings.HasPrefix(text, "#") {
			continue
		}
		if strings.Contains(text, metric) {
			t.Logf("found %s\n", scanner.Text())
			curr_count, _ := strconv.Atoi(text[len(text)-1:])
			// no specific labels, count all
			if len(labels) == 0 {
				count += curr_count
			}
			// return metric value with specified labels
			for i, label := range labels {
				if !strings.Contains(text, label) {
					break
				}
				if i == len(labels)-1 {
					// return directly since metrics are aggregated
					return curr_count
				}
			}
		}
	}
	return count
}

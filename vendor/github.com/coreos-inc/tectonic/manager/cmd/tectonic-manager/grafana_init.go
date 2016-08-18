package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var (
	// This command initializes a set of static dashboards in a grafana instance.
	// It is meant as a flexible intermediate solution and may be replaced with a
	// customized grafana container image, which contains an already initialized database.
	grafanaInitCmd = &cobra.Command{
		Use:   "grafana-init",
		Short: "initialize Grafana with predefined dashboards",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runGrafanaInit(args...)
		},
		SilenceUsage: true,
	}

	grafanaAddr              string
	prometheusAddr           string
	prometheusDatasourceName string
)

func init() {
	grafanaInitCmd.PersistentFlags().StringVar(&grafanaAddr, "grafana", "http://127.0.0.1:3000", "Grafana URL")
	grafanaInitCmd.PersistentFlags().StringVar(&prometheusAddr, "prometheus", "http://prometheus:9090", "Prometheus data source endpoint")
	grafanaInitCmd.PersistentFlags().StringVar(&prometheusDatasourceName, "prometheus-datasource-name", "tectonic-prometheus", "Prometheus data source name in Grafana")
	RootCmd.AddCommand(grafanaInitCmd)
}

func runGrafanaInit(dashboardFiles ...string) error {
	logger.Printf("creating Prometheus datasource with %s\n", prometheusAddr)
	for {
		if err := createDatasource(grafanaAddr, Datasource{
			Name:      prometheusDatasourceName,
			Type:      "prometheus",
			URL:       prometheusAddr,
			Access:    "proxy",
			BasicAuth: false,
		}); err != nil {
			logger.Printf("creating datasource using %q failed: %s", prometheusAddr, err)
			logger.Println("waiting 5 seconds before retrying to create datasource")
			time.Sleep(5 * time.Second)
			continue
		}
		logger.Println("successfully created prometheus datasource")
		break
	}

	for {
		for _, dashboardFile := range dashboardFiles {
			logger.Printf("creating dashboard %q", dashboardFile)
			if err := createDashboard(grafanaAddr, dashboardFile); err != nil {
				logger.Printf("creating dashboard from %q failed: %s", dashboardFile, err)
				logger.Println("waiting 5 seconds before retrying to create dashboards")
				time.Sleep(5 * time.Second)
				continue
			}
		}
		logger.Println("successfully created dashboards")
		break
	}

	<-stop
	return nil
}

// TODO(chance): investigate github.com/grafana/grafana/pkg/models

type Datasource struct {
	Name      string `json:"name"`
	Type      string `json:"type"`
	URL       string `json:"url"`
	Access    string `json:"access"`
	BasicAuth bool   `json:"basicAuth"`
}

func createDatasource(grafanaURL string, datasource Datasource) error {
	url := fmt.Sprintf("%s/api/datasources", grafanaURL)
	return httpJSONPost(url, datasource)
}

func createDashboard(grafanaURL, dashboardFile string) error {
	url := fmt.Sprintf("%s/api/dashboards/db", grafanaURL)
	f, err := os.Open(dashboardFile)
	if err != nil {
		return err
	}
	defer f.Close()

	var dashboard map[string]interface{}
	if err := json.NewDecoder(f).Decode(&dashboard); err != nil {
		return err
	}

	data := struct {
		Dashboard map[string]interface{} `json:"dashboard"`
		Overwrite bool                   `json:"overwrite"`
	}{
		Dashboard: dashboard,
		Overwrite: true,
	}
	return httpJSONPost(url, data)
}

func httpJSONPost(url string, data interface{}) error {
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(&data); err != nil {
		return err
	}

	resp, err := http.Post(url, "application/json", &buf)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status code %q: %s", resp.StatusCode, b)
	}
	return nil
}

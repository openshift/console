package actions

import (
	"encoding/json"
	"io/ioutil"
	"testing"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chartutil"
	kubefake "helm.sh/helm/v3/pkg/kube/fake"
)

func TestRenderManifests(t *testing.T) {
	tests := []struct {
		testType      string
		name          string
		chart         string
		values        []byte
		releaseName   string
		templateValue string
	}{
		{
			testType:    "valid chartPath",
			name:        "template-with-default-values",
			chart:       "../testdata/influxdb-3.0.2.tgz",
			values:      nil,
			releaseName: "test-influxdb",
			templateValue: `---
# Source: influxdb/templates/config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: "test-influxdb"
  labels:
    app: "test-influxdb"
    chart: "influxdb-3.0.2"
    release: "test"
    heritage: "Helm"
data:
  influxdb.conf: |+
    reporting-disabled = false
    bind-address = ":8088"

    [meta]
      dir = "/var/lib/influxdb/meta"
      retention-autocreate = true
      logging-enabled = true

    [data]
      dir = "/var/lib/influxdb/data"
      wal-dir = "/var/lib/influxdb/wal"
      query-log-enabled = true
      cache-max-memory-size = 1073741824
      cache-snapshot-memory-size = 26214400
      cache-snapshot-write-cold-duration = "10m0s"
      compact-full-write-cold-duration = "4h0m0s"
      max-series-per-database = 1000000
      max-values-per-tag = 100000
      index-version = "inmem"
      trace-logging-enabled = false

    [coordinator]
      write-timeout = "10s"
      max-concurrent-queries = 0
      query-timeout = "0s"
      log-queries-after = "0s"
      max-select-point = 0
      max-select-series = 0
      max-select-buckets = 0

    [retention]
      enabled = true
      check-interval = "30m0s"

    [shard-precreation]
      enabled = true
      check-interval = "10m0s"
      advance-period = "30m0s"

    [admin]
      enabled = false
      bind-address = ":8083"
      https-enabled = false
      https-certificate = "/etc/ssl/influxdb.pem"

    [monitor]
      store-enabled = true
      store-database = "_internal"
      store-interval = "10s"

    [subscriber]
      enabled = true
      http-timeout = "30s"
      insecure-skip-verify = false
      ca-certs = ""
      write-concurrency = 40
      write-buffer-size = 1000

    [http]
      enabled = true
      bind-address = ":8086"
      flux-enabled = true
      auth-enabled = false
      log-enabled = true
      write-tracing = false
      pprof-enabled = true
      https-enabled = false
      https-certificate = "/etc/ssl/influxdb.pem"
      https-private-key = ""
      max-row-limit = 10000
      max-connection-limit = 0
      shared-secret = "beetlejuicebeetlejuicebeetlejuice"
      realm = "InfluxDB"
      unix-socket-enabled = false
      bind-socket = "/var/run/influxdb.sock"
    
    # TODO: allow multiple graphite listeners
    
    [[graphite]]
      enabled = false
      bind-address = ":2003"
      database = "graphite"
      retention-policy = "autogen"
      protocol = "tcp"
      batch-size = 5000
      batch-pending = 10
      batch-timeout = "1s"
      consistency-level = "one"
      separator = "."
      udp-read-buffer = 0
    
    # TODO: allow multiple collectd listeners with templates

    [[collectd]]
      enabled = false
      bind-address = ":25826"
      database = "collectd"
      retention-policy = "autogen"
      batch-size = 5000
      batch-pending = 10
      batch-timeout = "10s"
      read-buffer = 0
      typesdb = "/usr/share/collectd/types.db"
      security-level = "none"
      auth-file = "/etc/collectd/auth_file"
    
    # TODO: allow multiple opentsdb listeners with templates

    [[opentsdb]]
      enabled = false
      bind-address = ":4242"
      database = "opentsdb"
      retention-policy = "autogen"
      consistency-level = "one"
      tls-enabled = false
      certificate = "/etc/ssl/influxdb.pem"
      batch-size = 1000
      batch-pending = 5
      batch-timeout = "1s"
      log-point-errors = true
    
    # TODO: allow multiple udp listeners with templates

    [[udp]]
      enabled = false
      bind-address = ":8089"
      database = "udp"
      retention-policy = "autogen"
      batch-size = 5000
      batch-pending = 10
      read-buffer = 0
      batch-timeout = "1s"
      precision = "ns"

    [continuous_queries]
      log-enabled = true
      enabled = true
      run-interval = "1s"

    [logging]
      format =  "auto"
      level =  "info"
      supress-logo = false
---
# Source: influxdb/templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: "test-influxdb"
  labels:
    app: "test-influxdb"
    chart: "influxdb-3.0.2"
    release: "test"
    heritage: "Helm"
spec:
  type: ClusterIP
  ports:
  - name: api
    port: 8086
    targetPort: 8086
  - name: rpc
    port: 8088
    targetPort: 8088
  selector:
    app: test-influxdb
---
# Source: influxdb/templates/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: "test-influxdb"
  labels:
    app: "test-influxdb"
    chart: "influxdb-3.0.2"
    release: "test"
    heritage: "Helm"
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test-influxdb
  serviceName: "test-influxdb"
  template:
    metadata:
      labels:
        app: test-influxdb
        release: "test"
    spec:
      containers:
      - name: test-influxdb
        image: "influxdb:1.7.6-alpine"
        imagePullPolicy: "IfNotPresent"
        resources:
          {}
        ports:
        - name: api
          containerPort: 8086
        livenessProbe:
          httpGet:
            path: /ping
            port: api
          initialDelaySeconds: 30
          timeoutSeconds: 5
        readinessProbe:
          httpGet:
            path: /ping
            port: api
          initialDelaySeconds: 5
          timeoutSeconds: 1
        volumeMounts:
        - name: test-influxdb-data
          mountPath: /var/lib/influxdb
        - name: config
          mountPath: /etc/influxdb
      volumes:
      - name: config
        configMap:
          name: test-influxdb
  volumeClaimTemplates:
    - metadata:
        name: test-influxdb-data
        annotations:
      spec:
        accessModes:
          - "ReadWriteOnce"
        resources:
          requests:
            storage: "8Gi"
`,
		},
		{
			testType:    "valid chartPath",
			name:        "template-with-custom-values",
			chart:       "../testdata/influxdb-3.0.2.tgz",
			values:      []byte("{\"service\": { \"type\": \"NodePort\" }, \"persistence\": {\"size\": \"16Gi\"}}"),
			releaseName: "test",
			templateValue: `---
# Source: influxdb/templates/config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: "test-influxdb"
  labels:
    app: "test-influxdb"
    chart: "influxdb-3.0.2"
    release: "test"
    heritage: "Helm"
data:
  influxdb.conf: |+
    reporting-disabled = false
    bind-address = ":8088"

    [meta]
      dir = "/var/lib/influxdb/meta"
      retention-autocreate = true
      logging-enabled = true

    [data]
      dir = "/var/lib/influxdb/data"
      wal-dir = "/var/lib/influxdb/wal"
      query-log-enabled = true
      cache-max-memory-size = 1073741824
      cache-snapshot-memory-size = 26214400
      cache-snapshot-write-cold-duration = "10m0s"
      compact-full-write-cold-duration = "4h0m0s"
      max-series-per-database = 1000000
      max-values-per-tag = 100000
      index-version = "inmem"
      trace-logging-enabled = false

    [coordinator]
      write-timeout = "10s"
      max-concurrent-queries = 0
      query-timeout = "0s"
      log-queries-after = "0s"
      max-select-point = 0
      max-select-series = 0
      max-select-buckets = 0

    [retention]
      enabled = true
      check-interval = "30m0s"

    [shard-precreation]
      enabled = true
      check-interval = "10m0s"
      advance-period = "30m0s"

    [admin]
      enabled = false
      bind-address = ":8083"
      https-enabled = false
      https-certificate = "/etc/ssl/influxdb.pem"

    [monitor]
      store-enabled = true
      store-database = "_internal"
      store-interval = "10s"

    [subscriber]
      enabled = true
      http-timeout = "30s"
      insecure-skip-verify = false
      ca-certs = ""
      write-concurrency = 40
      write-buffer-size = 1000

    [http]
      enabled = true
      bind-address = ":8086"
      flux-enabled = true
      auth-enabled = false
      log-enabled = true
      write-tracing = false
      pprof-enabled = true
      https-enabled = false
      https-certificate = "/etc/ssl/influxdb.pem"
      https-private-key = ""
      max-row-limit = 10000
      max-connection-limit = 0
      shared-secret = "beetlejuicebeetlejuicebeetlejuice"
      realm = "InfluxDB"
      unix-socket-enabled = false
      bind-socket = "/var/run/influxdb.sock"
    
    # TODO: allow multiple graphite listeners
    
    [[graphite]]
      enabled = false
      bind-address = ":2003"
      database = "graphite"
      retention-policy = "autogen"
      protocol = "tcp"
      batch-size = 5000
      batch-pending = 10
      batch-timeout = "1s"
      consistency-level = "one"
      separator = "."
      udp-read-buffer = 0
    
    # TODO: allow multiple collectd listeners with templates

    [[collectd]]
      enabled = false
      bind-address = ":25826"
      database = "collectd"
      retention-policy = "autogen"
      batch-size = 5000
      batch-pending = 10
      batch-timeout = "10s"
      read-buffer = 0
      typesdb = "/usr/share/collectd/types.db"
      security-level = "none"
      auth-file = "/etc/collectd/auth_file"
    
    # TODO: allow multiple opentsdb listeners with templates

    [[opentsdb]]
      enabled = false
      bind-address = ":4242"
      database = "opentsdb"
      retention-policy = "autogen"
      consistency-level = "one"
      tls-enabled = false
      certificate = "/etc/ssl/influxdb.pem"
      batch-size = 1000
      batch-pending = 5
      batch-timeout = "1s"
      log-point-errors = true
    
    # TODO: allow multiple udp listeners with templates

    [[udp]]
      enabled = false
      bind-address = ":8089"
      database = "udp"
      retention-policy = "autogen"
      batch-size = 5000
      batch-pending = 10
      read-buffer = 0
      batch-timeout = "1s"
      precision = "ns"

    [continuous_queries]
      log-enabled = true
      enabled = true
      run-interval = "1s"

    [logging]
      format =  "auto"
      level =  "info"
      supress-logo = false
---
# Source: influxdb/templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: "test-influxdb"
  labels:
    app: "test-influxdb"
    chart: "influxdb-3.0.2"
    release: "test"
    heritage: "Helm"
spec:
  type: NodePort
  ports:
  - name: api
    port: 8086
    targetPort: 8086
  - name: rpc
    port: 8088
    targetPort: 8088
  selector:
    app: test-influxdb
---
# Source: influxdb/templates/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: "test-influxdb"
  labels:
    app: "test-influxdb"
    chart: "influxdb-3.0.2"
    release: "test"
    heritage: "Helm"
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test-influxdb
  serviceName: "test-influxdb"
  template:
    metadata:
      labels:
        app: test-influxdb
        release: "test"
    spec:
      containers:
      - name: test-influxdb
        image: "influxdb:1.7.6-alpine"
        imagePullPolicy: "IfNotPresent"
        resources:
          {}
        ports:
        - name: api
          containerPort: 8086
        livenessProbe:
          httpGet:
            path: /ping
            port: api
          initialDelaySeconds: 30
          timeoutSeconds: 5
        readinessProbe:
          httpGet:
            path: /ping
            port: api
          initialDelaySeconds: 5
          timeoutSeconds: 1
        volumeMounts:
        - name: test-influxdb-data
          mountPath: /var/lib/influxdb
        - name: config
          mountPath: /etc/influxdb
      volumes:
      - name: config
        configMap:
          name: test-influxdb
  volumeClaimTemplates:
    - metadata:
        name: test-influxdb-data
        annotations:
      spec:
        accessModes:
          - "ReadWriteOnce"
        resources:
          requests:
            storage: "16Gi"
`,
		},
		{
			testType:      "invalid chartPath",
			name:          "template-with-invalid-chart-path",
			chart:         "../testdata/influxdb-3.0.1.tgz",
			values:        []byte("{\"service\": { \"type\": \"NodePort\" }, \"persistence\": {\"size\": \"16Gi\"}}"),
			releaseName:   "test",
			templateValue: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			actionConfig := &action.Configuration{
				Releases:     nil,
				KubeClient:   &kubefake.PrintingKubeClient{Out: ioutil.Discard},
				Capabilities: chartutil.DefaultCapabilities,
				Log:          func(format string, v ...interface{}) {},
			}

			var m map[string]interface{}
			if tt.values != nil {
				err := json.Unmarshal(tt.values, &m)
				if err != nil {
					t.Errorf("Failed to parse values to map[string]interface{}")
				}

				txt, err := RenderManifests(tt.releaseName, tt.chart, m, actionConfig)

				if tt.testType == "valid chartPath" {
					if err != nil {
						t.Error("Should not throw error for valid chart path")
					}
					if tt.templateValue != txt {
						t.Error("Template text isn't matching")
					}
				} else if tt.testType == "invalid chartPath" {
					if err == nil {
						t.Error("Should throw an error while locating invalid chart")
					}
				}
			}
		})
	}
}

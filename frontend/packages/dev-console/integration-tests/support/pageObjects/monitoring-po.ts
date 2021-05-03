export const monitoringPO = {
  tabs: {
    dashboard: '[data-test-id="horizontal-link-Dashboard"]',
    metrics: '[data-test-id="horizontal-link-Metrics"]',
    alerts: '[data-test-id="horizontal-link-Alerts"]',
    events: '[data-test-id="horizontal-link-Events"]',
  },
  timeRange: '',
  refreshInterval: '',
  dashboardTab: {
    workloadsFilter: '#odc-monitoring-dashboard-workload-filter',
    dashboard: '[data-test-id="dashboard"]',
    sections: {
      cpuUsage: '',
      memoryUsage: '',
      receiveBandwidth: '',
      transmitBandwidth: '',
      rateOfReceivedPackets: '',
      rateOfTransmittedPackets: '',
      rateOfReceivedPacketsDropped: '',
      rateOfTransmittedPacketsDropped: '',
    },
  },
  metricsTab: {
    selectQuery: '.odc-metrics-query-input button[type="button"]',
    queryExpression: 'textarea[placeholder="Expression (press Shift+Enter for newlines)"]',
    cpuGraph: 'div.pf-c-chart.query-browser__graph-container',
    podsList: 'table[aria-label="query results table"]',
    showPromQL: '',
    hidePromQL: '',
    emptyQueryMessage: '',
    resetZoom: '',
  },
  eventsTab: {
    resources: '',
    selectedResource: '.form-group ul li span',
    types: '[data-test-id="dropdown-button"]',
  },
  alertsTab: {
    filter: '[data-test-id="filter-dropdown-toggle"] button',
    search: 'input[data-test-id="item-filter"]',
    table: '[role="grid"]',
    alertsTable: {
      columns: {
        name: '[data-label="Name"]',
        severity: '[data-label="Severity"]',
        alertState: '[data-label="Alert state"]',
        notifications: '[data-label="Notifications"]',
      },
    },
  },
};

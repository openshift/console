import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Route, Switch } from 'react-router-dom';

import {NavTitle, LoadingInline, cloudProviderNames, DocumentationSidebar} from './utils';
import { SecurityScanningOverview } from './secscan/security-scan-overview';
import { StartGuide } from './start-guide';
import * as classNames from'classnames';
import { NavBar } from './utils';
import { Gauge, Line } from './graphs';

const tectonicHealthMsgs = {
  ok: 'All systems go',
  unknown: 'The console service cannot be reached.'
};

const k8sHealthMsgs = {
  ok: 'All systems go',
  unknown: 'API server connection has a problem',
  'access-denied': 'Access denied due to cluster policy'
};

const StatusIconRow = ({state, text}) => {
  const iconClasses = {
    ok: 'fa-check',
    warning: 'fa-warning',
    critical: 'fa-warning',
    unknown: 'fa-question-circle',
    'access-denied': 'fa-ban'
  };
  return <div className={classNames('co-m-status', [`co-m-status--${state}`])}>
    <i className={classNames('co-m-status__icon', 'fa', iconClasses[state])}></i>
    <span className="co-m-status__text">{text}</span>
  </div>;
};

export const StatusIcon = ({state, text}) => {
  if (['ok', 'warning', 'critical', 'unknown', 'access-denied'].includes(state)) {
    return <StatusIconRow state={state} text={text} />;
  }

  return <div className="co-m-status">
    <span className="co-m-status__text">{text}</span>
  </div>;
};

export const SubHeaderRow = ({header}) => {
  return <div className="row">
    <div className="col-xs-12">
      <h4 className="cluster-overview-cell__title">
        {header}
      </h4>
    </div>
  </div>;
};

const ClusterHealthRow = ({title, state, text}) => {
  return <div className="row cluster-overview-cell__info-row">
    <div className="col-xs-6 cluster-overview-cell__info-row__first-cell">
      {title}
    </div>
    <div className="col-xs-6 cluster-overview-cell__info-row__last-cell">
      {!state && <LoadingInline />}
      <StatusIcon state={state} text={text} />
    </div>
  </div>;
};

const SoftwareDetailRow = ({title, detail, text, children}) => {
  return <div className="row cluster-overview-cell__info-row">
    <div className="col-xs-6 cluster-overview-cell__info-row__first-cell">
      {title}
    </div>
    <div className="col-xs-6 cluster-overview-cell__info-row__last-cell">
      <div>
        {!detail && <LoadingInline />}
        {detail === 'unknown' ? <StatusIcon state={detail} text={text} /> : detail}
      </div>
      {children}
    </div>
  </div>;
};

const Grafana = () => <div>
  { /* CPU cores (dial) */ }
  <iframe src="/api/v1/proxy/namespaces/tectonic-system/services/grafana:3001/dashboard-solo/db/resource-requests?orgId=1&panelId=2&theme=light&refresh=30s" width="450" height="200" frameBorder="0"></iframe>
  { /* cluster memory (dial) */ }
  <iframe src="/api/v1/proxy/namespaces/tectonic-system/services/grafana:3001/dashboard-solo/db/resource-requests?orgId=1&panelId=4&theme=light&refresh=30s" width="450" height="200" frameBorder="0"></iframe>

  { /* system load */ }
  <iframe style={{border: '1px solid #fbfbfb', margin: 10}} src="/api/v1/proxy/namespaces/tectonic-system/services/grafana:3001/dashboard-solo/db/all-nodes?orgId=1&panelId=9&theme=light&refresh=30s" width="450" height="200" frameBorder="0"></iframe>
  { /* memory usage */ }
  <iframe style={{border: '1px solid #fbfbfb', margin: 10}} src="/api/v1/proxy/namespaces/tectonic-system/services/grafana:3001/dashboard-solo/db/all-nodes?orgId=1&panelId=4&theme=light&refresh=30s" width="450" height="200" frameBorder="0"></iframe>
  { /* disk i/o */ }
  <iframe style={{border: '1px solid #fbfbfb', margin: 10}} src="/api/v1/proxy/namespaces/tectonic-system/services/grafana:3001/dashboard-solo/db/all-nodes?orgId=1&panelId=6&theme=light&refresh=30s" width="450" height="200" frameBorder="0"></iframe>

  { /* memory usage (dial) */ }
  <iframe style={{border: '1px solid #fbfbfb', margin: 10}} src="/api/v1/proxy/namespaces/tectonic-system/services/grafana:3001/dashboard-solo/db/all-nodes?orgId=1&panelId=5&theme=light&refresh=30s" width="450" height="200" frameBorder="0"></iframe>
  { /* disk space (dial) */ }
  <iframe style={{border: '1px solid #fbfbfb', margin: 10}} src="/api/v1/proxy/namespaces/tectonic-system/services/grafana:3001/dashboard-solo/db/all-nodes?orgId=1&panelId=7&theme=light&refresh=30s" width="450" height="200" frameBorder="0"></iframe>


  { /* network in/out */ }
  <iframe style={{border: '1px solid #fbfbfb', margin: 10}} src="/api/v1/proxy/namespaces/tectonic-system/services/grafana:3001/dashboard-solo/db/all-nodes?orgId=1&panelId=8&theme=light&refresh=30s" width="600" height="300" frameBorder="0"></iframe>
  <iframe style={{border: '1px solid #eee', margin: 10}} src="/api/v1/proxy/namespaces/tectonic-system/services/grafana:3001/dashboard-solo/db/all-nodes?orgId=1&panelId=10&theme=light&refresh=30s" width="600" height="300" frameBorder="0"></iframe>

  <iframe style={{border: '1px solid #eee', margin: 10}} src="/api/v1/proxy/namespaces/tectonic-system/services/grafana:3001/dashboard-solo/db/resource-requests?orgId=1&panelId=1&theme=light&refresh=30s" width="600" height="600" frameBorder="0"></iframe>
  <iframe style={{border: '1px solid #eee', margin: 10}} src="/api/v1/proxy/namespaces/tectonic-system/services/grafana:3001/dashboard-solo/db/resource-requests?orgId=1&panelId=3&theme=light&refresh=30s" width="600" height="600" frameBorder="00"></iframe>
</div>;
Grafana.displayName = 'Grafana';

const GrafanaDash = () => <div>
  <iframe src="/api/v1/proxy/namespaces/tectonic-system/services/grafana:3001/dashboard/db/all-nodes?orgId=1&theme=light" width="1000" height="1600" frameBorder="0"></iframe>
</div>;
GrafanaDash.displayName = 'GrafanaDash';

const multiLoad = [
  {
    name: '1m',
    query: 'sum(node_load1)',
  },
  {
    name: '5m',
    query: 'sum(node_load5)',
  },
  {
    name: '15m',
    query: 'sum(node_load15)',
  },
];

const Plotly = () => <div>
  <div className="row">
    <div className="col-xs-6">
      <Line title="Idle CPU" query={'sum(rate(node_cpu{mode="idle"}[2m])) * 100'} />
    </div>
    <div className="col-xs-6">
      <Line title="System Load" query={multiLoad} />
    </div>
  </div>
  <div className="row">
    <div className="col-xs-4">
      <Gauge title="Memory Usage" query={'((sum(node_memory_MemTotal) - sum(node_memory_MemFree) - sum(node_memory_Buffers) - sum(node_memory_Cached)) / sum(node_memory_MemTotal)) * 100'} />
    </div>
    <div className="col-xs-4">
      <Gauge title="Disk Usage" query={'(sum(node_filesystem_size{device!="rootfs"}) - sum(node_filesystem_free{device!="rootfs"})) / sum(node_filesystem_size{device!="rootfs"}) * 100'} />
    </div>
  </div>
  <div className="row">
    <div className="col-xs-6">
      <Line title="Network Received" query={'sum(rate(node_network_receive_bytes{device!~"lo"}[5m]))'} />
    </div>
    <div className="col-xs-6">
      <Line title="Network Transmitted" query={'sum(rate(node_network_transmit_bytes{device!~"lo"}[5m]))'} />
    </div>
  </div>
</div>;
Plotly.displayName = 'Plotly';

const Overview = props => <div className="cluster-overview">
  <div className="cluster-overview-row">

    <div className="cluster-overview-cell co-m-pane">
      <SubHeaderRow header="Cluster Health" />

      <div className="cluster-overview-cell__info-row--first">
        <ClusterHealthRow title="Tectonic Console" state={props.tectonicHealth}
          text={tectonicHealthMsgs[props.tectonicHealth]} />
      </div>

      <ClusterHealthRow title="Kubernetes API Connection" state={props.kubernetesHealth}
        text={k8sHealthMsgs[props.kubernetesHealth]} />

      <br />
      <SecurityScanningOverview
        {...props}
        required="SECURITY_LABELLER"
      />
    </div>

    <div className="cluster-overview-cell co-m-pane">
      <SubHeaderRow header="Software Details" />

      <div className="cluster-overview-cell__info-row--first">
        <SoftwareDetailRow title="Kubernetes"
          detail={props.kubernetesVersion} text="Kubernetes version could not be determined." />
      </div>

      <SoftwareDetailRow title="Tectonic" detail={props.currentTectonicVersion || props.tectonicVersion}
        text="Tectonic version could not be determined." >
        <div>
          {// eslint-disable-next-line react/jsx-no-target-blank
          } <a href="https://coreos.com/tectonic/releases/" target="_blank" rel="noopener">Release Notes</a>
        </div>
      </SoftwareDetailRow>

      <SoftwareDetailRow title="License" detail={props.tectonicLicense}
        text="Tectonic License could not be determined." />

      {props.cloudProviders &&
        <SoftwareDetailRow title="Cloud Provider" detail={cloudProviderNames(props.cloudProviders)}
          text="Cloud Provider could not be determined." />
      }

    </div>
  </div>
</div>;
Overview.displayName = 'Overview';

const pages = [
  {
    name: 'Old overview',
    href: '',
    component: Overview,
  },
  {
    name: 'Plotly',
    href: 'plotly',
    component: Plotly
  },
  {
    name: 'Grafana',
    href: 'grafana',
    component: Grafana,
  },
  {
    name: 'Grafana 1 iframe',
    href: 'grafanadash',
    component: GrafanaDash,
  },
];

export const ClusterOverviewPage = props => {
  return <div className="co-p-cluster">
    <div className="co-p-cluster__body">
      <StartGuide dismissible={true} />
      <Helmet>
        <title>Cluster Status</title>
      </Helmet>
      <NavTitle title="Cluster Status" />

      <NavBar pages={pages} />
      <Switch>
        {pages.map(p => <Route path={`/${p.href}`} exact key={p.name} render={() =>
          <p.component {...props} />} />)}
      </Switch>
    </div>
    <DocumentationSidebar />
  </div>;
};

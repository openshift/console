import * as React from 'react';
import { Helmet } from 'react-helmet';

import {NavTitle, LoadingInline, cloudProviderNames, DocumentationSidebar} from './utils';
import { SecurityScanningOverview } from './secscan/security-scan-overview';
import { StartGuide } from './start-guide';
import * as classNames from'classnames';
import { units } from './utils';
import { Gauge, Line, Bar } from './graphs';

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

const multiLoadQueries = [
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

const memoryQueries = [
  {
    name: 'Total',
    query: 'sum(node_memory_MemTotal)',
  },
  {
    name: 'Free',
    query: 'sum(node_memory_MemFree)',
  },
];

const humanizeMem = v => units.humanize(v, 'binaryBytes', true).string;
const humanizeCPU = v => units.humanize(v, 'numeric', true).string;

const Graphs = () => <div style={{padding: '15px 20px'}}>
  <div className="row">
    <div className="col-lg-3">
      <Line title="Idle CPU" query={'sum(rate(node_cpu{mode="idle"}[2m])) * 100'} />
    </div>
    <div className="col-lg-6">
      <Line title="Cluster Load Average" query={multiLoadQueries} />
    </div>
    <div className="col-lg-3">
      <Bar title="CPU Usage by Namespace" query={'sort(topk(10, sum by (namespace) (namespace:container_cpu_usage:sum)))'} humanize={humanizeCPU} />
    </div>
  </div>
  <div className="row">
    <div className="col-lg-3">
      <Gauge title="Memory Usage" query={'((sum(node_memory_MemTotal) - sum(node_memory_MemFree) - sum(node_memory_Buffers) - sum(node_memory_Cached)) / sum(node_memory_MemTotal)) * 100'} />
    </div>
    <div className="col-lg-6">
      <Line title="Memory" query={memoryQueries} />
    </div>
    <div className="col-lg-3">
      <Bar title="Mem. Usage by Namespace" query={'sort(topk(10, sum by (namespace) (namespace:container_memory_usage_bytes:sum)))'} humanize={humanizeMem} />
    </div>
  </div>

  <div className="row">
    <div className="col-lg-3">
      <Gauge title="Disk Usage" query={'(sum(node_filesystem_size{device!="rootfs"}) - sum(node_filesystem_free{device!="rootfs"})) / sum(node_filesystem_size{device!="rootfs"}) * 100'} />
    </div>
    <div className="col-lg-3">
      <Bar title="Network Receive (Top 10 Namespaces)" query={'sort(topk(10, sum by (namespace) (container_network_receive_bytes_total)))'} humanize={humanizeMem} />
    </div>
    <div className="col-lg-3">
      <Bar title="Network Transmit (Top 10 Namespaces)" query={'sort(topk(10, sum by (namespace) (container_network_transmit_bytes_total)))'} humanize={humanizeMem} />
    </div>
  </div>

  <div className="row">
    <div className="col-lg-6">
      <Line title="Network Received" query={'sum(rate(node_network_receive_bytes{device!~"lo"}[5m]))'} />
    </div>
    <div className="col-lg-6">
      <Line title="Network Transmitted" query={'sum(rate(node_network_transmit_bytes{device!~"lo"}[5m]))'} />
    </div>
  </div>
</div>;
Graphs.displayName = 'Graphs';

export const ClusterOverviewPage = props => {
  return <div className="co-p-cluster">
    <div className="co-p-cluster__body">
      <StartGuide dismissible={true} />
      <Helmet>
        <title>Cluster Status</title>
      </Helmet>
      <NavTitle title="Cluster Status" />
      <div className="cluster-overview">
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
      </div>

      <Graphs />
    </div>
    <DocumentationSidebar />
  </div>;
};

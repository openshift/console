import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';

import { coFetch, coFetchJSON } from '../co-fetch';
import { NavTitle, LoadingInline, DocumentationSidebar, cloudProviderNames} from './utils';
import { k8sBasePath } from '../module/k8s';
import { SecurityScanningOverview } from './secscan/security-scan-overview';
import { StartGuide } from './start-guide';
import { Gauge, Status, prometheusBasePath } from './graphs';

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

export const SubHeaderRow = ({header, children}) => {
  return <div className="row">
    <div className="col-xs-12">
      <h4 className="cluster-overview-cell__title">
        {header}
      </h4>
      {children}
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

const errorStatus = err => {
  if (_.get(err.response, 'ok') === false) {
    return {
      short: '?',
      status: '', // Gray
      long: err.message,
    };
  }
  // Generic network error handling.
  return {
    short: 'ERROR',
    long: err.message,
    status: 'ERROR',
  };
};

const fetchHealth = () => coFetch(`${k8sBasePath}/healthz`)
  .then(response => response.text())
  .then(body => {
    if (body === 'ok') {
      return {short: 'UP', long: 'All good', status: 'OK'};
    }
    return {short: 'ERROR', long: body, status: 'ERROR'};
  })
  .catch(errorStatus);

const fetchTectonicHealth = () => coFetchJSON('health')
  .then(() => ({short: 'UP', long: 'All good', status: 'OK'}))
  .catch(() => ({short: 'ERROR', long: 'The console service cannot be reached', status: 'ERROR'}));

const fetchQuery = (name, q) => coFetchJSON(`${prometheusBasePath}/api/v1/query?query=${encodeURIComponent(q)}`)
  .then(res => {
    const value = parseInt(_.get(res, 'data.result[0].value[1]'), 10) || 0;
    return {
      short: value,
      status: value === 0 ? 'OK' : 'WARN',
      long: name,
    };
  })
  .catch(errorStatus);


const DashboardLink = ({to}) => <div className="col-lg-3 text-right" style={{marginTop: 16}}>
  <Link target="_blank" to={to}>View Dashboard&nbsp;&nbsp;<i className="fa fa-external-link" /></Link>
</div>;

export const ClusterOverviewPage = props => {
  return <div className="co-p-cluster">
    <div className="co-p-cluster__body">
      <StartGuide dismissible={true} />
      <Helmet>
        <title>Cluster Status</title>
      </Helmet>
      <NavTitle title="Cluster Status" />
      <div className="cluster-overview-cell co-m-pane">
        <div className="row">
          <div className="col-lg-9">
            <h4>Cluster Health</h4>
          </div>
          <DashboardLink to="/grafana/dashboard/db/kubernetes-cluster-health?orgId=1" />
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-6">
            <Status title="Kubernetes API" fetch={fetchHealth} />
          </div>
          <div className="col-lg-3 col-md-6">
            <Status title="Tectonic Console" fetch={fetchTectonicHealth} />
          </div>
          <div className="col-lg-3 col-md-6">
            <Status
              title="Alerts Firing"
              fetch={() => fetchQuery('Alerts', 'sum(ALERTS{alertstate="firing", alertname!="DeadMansSwitch"})')}
              href="/alertmanager/#/alerts" target="_blank" rel="noopener"
            />
          </div>
          <div className="col-lg-3 col-md-6">
            <Status
              title="Crashlooping Pods"
              fetch={() => fetchQuery('Pods', 'count(increase(kube_pod_container_status_restarts[1h]) > 5)')}
              href="/all-namespaces/pods?rowFilter-pod-status=CrashLoopBackOff"
            />
          </div>
        </div>
        <br />

        <div className="row">
          <div className="col-lg-9">
            <h4>Control Plane Status</h4>
          </div>
          <DashboardLink to="/grafana/dashboard/db/kubernetes-control-plane-status?orgId=1" />
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-6">
            <Gauge title="API Servers Up" query={'(sum(up{job="apiserver"} == 1) / count(up{job="apiserver"})) * 100'} invert={true} thresholds={{warn: 15, error: 50}} />
          </div>
          <div className="col-lg-3 col-md-6">
            <Gauge title="Controller Managers Up" query={'(sum(up{job="kube-controller-manager"} == 1) / count(up{job="kube-controller-manager"})) * 100'} invert={true} thresholds={{warn: 15, error: 50}} />
          </div>
          <div className="col-lg-3 col-md-6">
            <Gauge title="Schedulers Up" query={'(sum(up{job="kube-scheduler"} == 1) / count(up{job="kube-scheduler"})) * 100'} invert={true} thresholds={{warn: 15, error: 50}} />
          </div>
          <div className="col-lg-3 col-md-6">
            <Gauge title="API Request Success Rate" query={'sum(rate(apiserver_request_count{code=~"2.."}[5m])) / sum(rate(apiserver_request_count[5m])) * 100'} invert={true} thresholds={{warn: 15, error: 30}} />
          </div>
        </div>
        <br />

        <div className="row">
          <div className="col-lg-9">
            <h4>Capacity Planning</h4>
          </div>
          <DashboardLink to="/grafana/dashboard/db/kubernetes-capacity-planning?orgId=1" />
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-6">
            <Gauge title="CPU Usage" query={'100 - (sum(rate(node_cpu{job="node-exporter",mode="idle"}[2m])) / count(node_cpu{job="node-exporter", mode="idle"})) * 100'} />
          </div>
          <div className="col-lg-3 col-md-6">
            <Gauge title="Memory Usage" query={'((sum(node_memory_MemTotal) - sum(node_memory_MemFree) - sum(node_memory_Buffers) - sum(node_memory_Cached)) / sum(node_memory_MemTotal)) * 100'} />
          </div>
          <div className="col-lg-3 col-md-6">
            <Gauge title="Disk Usage" query={'(sum(node_filesystem_size{device!="rootfs"}) - sum(node_filesystem_free{device!="rootfs"})) / sum(node_filesystem_size{device!="rootfs"}) * 100'} />
          </div>
          <div className="col-lg-3 col-md-6">
            <Gauge title="Pod Usage" query={'100 - (sum(kube_node_status_capacity_pods) - sum(kube_pod_info)) / sum(kube_node_status_capacity_pods) * 100'} />
          </div>
        </div>
        <br />
        <SecurityScanningOverview
          {...props}
          required="SECURITY_LABELLER"
        />
      </div>
    </div>

    <DocumentationSidebar>
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
    </DocumentationSidebar>
  </div>;
};

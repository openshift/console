import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';

import { coFetchJSON } from '../co-fetch';
import { NavTitle, LoadingInline, DocumentationSidebar, cloudProviderNames} from './utils';
import { k8sBasePath } from '../module/k8s';
import { SecurityScanningOverview } from './secscan/security-scan-overview';
import { StartGuide } from './start-guide';
import { Gauge, Status } from './graphs';

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

// TODO: (ggreer) handle 403
const fetchHealth = () => coFetchJSON(k8sBasePath)
  .then(() => ({short: 'UP', long: 'All good', status: 'OK'}))
  .catch(() => ({short: 'ERROR', long: 'API server connection has a problem', status: 'ERROR'}));

// TODO: (ggreer) handle 403
const fetchTectonicHealth = () => coFetchJSON('health')
  .then(() => ({short: 'UP', long: 'All good', status: 'OK'}))
  .catch(() => ({short: 'ERROR', long: 'The console service cannot be reached', status: 'ERROR'}));


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
          <div className="col-lg-9 pull-left">
            <h4>Cluster Health</h4>
          </div>
          <div className="col-lg-3 text-right">
            <Link to="/cluster-health"><h4>View Dashboard</h4></Link>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-4 col-md-6">
            <Status title="Kubernetes API" fetch={fetchHealth} />
          </div>
          <div className="col-lg-4 col-md-6">
            <Status title="Tectonic Console" fetch={fetchTectonicHealth} />
          </div>
        </div>
        <div className="row">
          <div className="col-lg-4 col-md-6">
            <Gauge title="CPU Usage" query={'sum(rate(node_cpu{mode!="idle"}[2m])) * 100'} />
          </div>
          <div className="col-lg-4 col-md-6">
            <Gauge title="Memory Usage" query={'((sum(node_memory_MemTotal) - sum(node_memory_MemFree) - sum(node_memory_Buffers) - sum(node_memory_Cached)) / sum(node_memory_MemTotal)) * 100'} />
          </div>
          <div className="col-lg-4 col-md-6">
            <Gauge title="Disk Usage" query={'(sum(node_filesystem_size{device!="rootfs"}) - sum(node_filesystem_free{device!="rootfs"})) / sum(node_filesystem_size{device!="rootfs"}) * 100'} />
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

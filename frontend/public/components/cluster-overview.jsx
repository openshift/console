import * as React from 'react';
import { Helmet } from 'react-helmet';

import {NavTitle, LoadingInline, cloudProviderNames, DocumentationSidebar} from './utils';
import { SecurityScanningOverview } from './secscan/security-scan-overview';
import { StartGuide } from './start-guide';
import * as classNames from'classnames';

const tectonicHealthMsgs = {
  'ok': 'All systems go',
  'unknown': 'The console service cannot be reached.'
};

const k8sHealthMsgs = {
  'ok': 'All systems go',
  'unknown': 'API server connection has a problem'
};

const StatusIconRow = ({state, text}) => {
  const iconClasses = {
    ok: 'fa-check',
    warning: 'fa-warning',
    critical: 'fa-warning',
    unknown: 'fa-question-circle'
  };
  return <div className={classNames('co-m-status', [`co-m-status--${state}`])}>
    <i className={classNames('co-m-status__icon', 'fa', iconClasses[state])}></i>
    <span className="co-m-status__text">{text}</span>
  </div>;
};

export const StatusIcon = ({state, text}) => {
  if (['ok', 'warning', 'critical', 'unknown'].includes(state)) {
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

export const ClusterOverviewPage = (props) => {
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
                <a href="https://coreos.com/tectonic/releases/" target="_blank">Release Notes</a>
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
    </div>
    <DocumentationSidebar />
  </div>;
};

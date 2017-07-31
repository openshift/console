import React from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';

import {NavTitle, LoadingInline, cloudProviderNames, DocumentationSidebar} from './utils';
import { stateToProps as featuresStateToProps } from '../features';
import classNames from 'classnames';

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

const StatusIcon = ({state, text}) => {
  if (['ok', 'warning', 'critical', 'unknown'].includes(state)) {
    return <StatusIconRow state={state} text={text} />;
  }

  return <div className="co-m-status">
    <span className="co-m-status__text">{text}</span>
  </div>;
};

const SubHeaderRow = ({header}) => {
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

const SecurityScanningRow = ({title, detail, text}) => {
  if (detail === null) {
    detail = <LoadingInline />;
  } else if (detail === 'unknown') {
    detail = <StatusIcon state={detail} text={text} />;
  }
  return <div className="row cluster-overview-cell__info-row">
    <div className="col-xs-6 cluster-overview-cell__info-row__first-cell">
      {title}
    </div>
    <div className="col-xs-6 cluster-overview-cell__info-row__last-cell">
      {detail}
    </div>
  </div>;
};

const securityScanStateToProps = (state, {required}) => {
  let canRender = true;
  if (required) {
    const flags = featuresStateToProps([required], state).flags;
    canRender = !!flags[required];
  }
  const props = { canRender };
  return props;
};

const areStatesEqual = (next, previous) => next.FLAGS.equals(previous.FLAGS) &&
  next.UI.get('activeNamespace') === previous.UI.get('activeNamespace') &&
  next.UI.get('location') === previous.UI.get('location');
const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign({}, ownProps, stateProps, dispatchProps);
const SecurityScanningOverview = connect(securityScanStateToProps, null, mergeProps, {pure: true, areStatesEqual})(
class SecurityScanningOverview_ extends React.PureComponent {
  render () {
    if (!this.props.canRender) {
      return null;
    }
    return <div>
      <SubHeaderRow header="Container Security Scanning" />
      <SecurityScanningRow title="Fixable Issues"
        detail={this.props.fixableIssues} text="Could not get fixable issues" />
      <SecurityScanningRow title="Scanned Pods"
        detail={this.props.scannedPods} text="Could not get scanned pods" />
    </div>;
  }
});

export const ClusterOverviewPage = (props) => {
  return <div className="co-p-cluster">
    <Helmet title="Cluster Status" />
    <div className="co-p-cluster__body">
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
    <DocumentationSidebar version={props.tectonicVersionObj} />
  </div>;
};

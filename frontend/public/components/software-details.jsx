import * as React from 'react';
import * as classNames from 'classnames';

import { k8sVersion } from '../module/status';
import { SafetyFirst } from './safety-first';
import { LoadingInline } from './utils';


const StatusIconRow = ({state, text}) => {
  const iconClasses = {
    ok: 'pficon-ok',
    warning: 'pficon-warning-triangle-o',
    critical: 'pficon-error-circle-o',
    unknown: 'pficon-unknown',
    'access-denied': 'fa-ban',
  };
  return <div className={classNames('co-m-status', [`co-m-status--${state}`])}>
    <i className={classNames('co-m-status__icon', 'pficon', iconClasses[state])}></i>
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
    <div className="col-xs-6">
      {title}
    </div>
    <div className="col-xs-6 text-right">
      <div>
        {!detail && <LoadingInline />}
        {detail === 'unknown' ? <StatusIcon state={detail} text={text} /> : detail}
      </div>
      {children}
    </div>
  </div>;
};

export class SoftwareDetails extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      kubernetesVersion: null,
    };
  }

  componentDidMount() {
    super.componentDidMount();
    this._checkKubernetesVersion();
  }

  _checkKubernetesVersion() {
    k8sVersion()
      .then((data) => this.setState({kubernetesVersion: data.gitVersion}))
      .catch(() => this.setState({kubernetesVersion: 'unknown'}));
  }

  render() {
    const {kubernetesVersion} = this.state;
    return <SoftwareDetailRow title="Kubernetes" detail={kubernetesVersion} text="Kubernetes version could not be determined." />;
  }
}

import * as React from 'react';
import * as classNames from 'classnames';

import { k8sVersion } from '../module/status';
import { FLAGS, connectToFlags, flagPending } from '../features';
import { SafetyFirst } from './safety-first';
import { LoadingInline } from './utils';

import { getKubeVirtVersion } from '../extend/kubevirt/module/status';

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

export const SoftwareDetails = connectToFlags(FLAGS.KUBEVIRT)(
  class SoftwareDetails extends SafetyFirst {
    constructor(props) {
      super(props);
      this.state = {
        kubernetesVersion: null,
        kubevirtVersion: null,
      };
    }

    componentDidMount() {
      super.componentDidMount();
      this._checkKubernetesVersion();
      this._checkKubeVirtVersion();
    }

    componentDidUpdate(prevProps) {
      if (prevProps.flags[FLAGS.KUBEVIRT] !== this.props.flags[FLAGS.KUBEVIRT]) {
        this._checkKubeVirtVersion();
      }
    }

    _checkKubernetesVersion() {
      k8sVersion()
        .then((data) => this.setState({kubernetesVersion: data.gitVersion}))
        .catch(() => this.setState({kubernetesVersion: 'unknown'}));
    }

    _checkKubeVirtVersion() {
      const kubevirtFlag = this.props.flags[FLAGS.KUBEVIRT];
      if (kubevirtFlag) {
        getKubeVirtVersion()
          .then((data) => this.setState({kubevirtVersion: data.gitVersion}))
          .catch(() => this.setState({kubevirtVersion: 'unknown'}));
      }
    }

    render() {
      const {kubernetesVersion, kubevirtVersion} = this.state;
      const kubevirtFlag = this.props.flags[FLAGS.KUBEVIRT];

      if (flagPending(kubevirtFlag)) {
        return null;
      }

      return <React.Fragment>
        <SoftwareDetailRow title="Kubernetes" detail={kubernetesVersion} text="Kubernetes version could not be determined." />
        {kubevirtFlag && <SoftwareDetailRow title="KubeVirt" detail={kubevirtVersion} text="KubeVirt version could not be determined." />}
      </React.Fragment>;
    }
  }
);

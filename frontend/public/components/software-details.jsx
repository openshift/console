import * as React from 'react';
import * as classNames from 'classnames';

import { productName } from '../branding';
import { k8sVersion } from '../module/status';
import { coFetchJSON } from '../co-fetch';
import { SafetyFirst } from './safety-first';
import { LoadingInline } from './utils';
import { FLAGS, connectToFlags, flagPending } from '../features';


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

export const SoftwareDetails = connectToFlags(FLAGS.OPENSHIFT)(
  class SoftwareDetails extends SafetyFirst {
    constructor(props) {
      super(props);
      this.state = {
        openshiftVersion: null,
        kubernetesVersion: null,
        openshiftVersionObj: null,
      };
    }

    componentDidMount() {
      super.componentDidMount();
      this._checkKubernetesVersion();
      this._checkOpenShiftVersion();
    }

    componentDidUpdate(prevProps) {
      if (prevProps.flags[FLAGS.OPENSHIFT] !== this.props.flags[FLAGS.OPENSHIFT]) {
        this._checkOpenShiftVersion();
      }
    }

    _checkOpenShiftVersion() {
      const openshiftFlag = this.props.flags[FLAGS.OPENSHIFT];
      if (openshiftFlag) {
        coFetchJSON('api/kubernetes/version/openshift')
          .then((data) => {
            this.setState({openshiftVersion: data.gitVersion, openshiftVersionObj: data});
          }).catch(() => this.setState({openshiftVersion: 'unknown'}));
      }
    }

    _checkKubernetesVersion() {
      k8sVersion()
        .then((data) => this.setState({kubernetesVersion: data.gitVersion}))
        .catch(() => this.setState({kubernetesVersion: 'unknown'}));
    }

    _checkOpenshiftVersion() {
      coFetchJSON('api/kubernetes/version/openshift')
        .then((data) => {
          this.setState({openshiftVersion: data.gitVersion, openshiftVersionObj: data});
        }).catch(() => this.setState({openshiftVersion: 'unknown'}));
    }

    render() {
      const {openshiftVersion, kubernetesVersion} = this.state;
      const openshiftFlag = this.props.flags[FLAGS.OPENSHIFT];

      if (flagPending(openshiftFlag)) {
        return null;
      }

      return <React.Fragment>
        <SoftwareDetailRow title="Kubernetes" detail={kubernetesVersion} text="Kubernetes version could not be determined." />
        {openshiftFlag && <SoftwareDetailRow title={productName} detail={openshiftVersion} text={`${productName} version could not be determined.`} />}
      </React.Fragment>;
    }
  });

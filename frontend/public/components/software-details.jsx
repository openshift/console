import * as _ from 'lodash';
import * as React from 'react';
import * as classNames from 'classnames';

import { k8sKinds, k8sGet } from '../module/k8s';
import { k8sVersion } from '../module/status';
import { coFetchJSON } from '../co-fetch';
import { SafetyFirst } from './safety-first';
import { entitlementTitle } from './license-notifier';
import { LoadingInline, cloudProviderNames } from './utils';
import { clusterAppVersionName } from './channel-operators/tectonic-channel';


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


export class SoftwareDetails extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      tectonicVersion: null,
      tectonicLicense: null,
      kubernetesVersion: null,
      cloudProviders: null,
      tectonicVersionObj: null,
      currentTectonicVersion: null,
    };
  }

  componentDidMount() {
    super.componentDidMount();
    this._checkTectonicVersion();
    this._checkKubernetesVersion();
    this._checkCloudProvider();
    this._checkAppVersions();
  }

  _checkTectonicVersion() {
    coFetchJSON('api/tectonic/version')
      .then((data) => {
        const license = entitlementTitle(data.entitlementKind, data.entitlementCount);
        this.setState({ tectonicVersion: data.version, tectonicLicense: license, tectonicVersionObj: data });
      })
      .catch(() => this.setState({ tectonicVersion: 'unknown', tectonicLicense: 'unknown' }));
  }

  _checkAppVersions() {
    k8sGet(k8sKinds.AppVersion).then((appversions) => {
      const tectonicTPR = _.find(appversions.items, (a) => a.metadata.name === clusterAppVersionName);
      if (tectonicTPR) {
        this.setState({ currentTectonicVersion: tectonicTPR.status.currentVersion });
      }
    }).catch(() => this.setState({ currentTectonicVersion: null }));
  }

  _checkKubernetesVersion() {
    k8sVersion()
      .then((data) => this.setState({ kubernetesVersion: data.gitVersion }))
      .catch(() => this.setState({ kubernetesVersion: 'unknown' }));
  }

  _checkCloudProvider() {
    k8sGet(k8sKinds.ConfigMap, 'tectonic-config', 'tectonic-system').then((configMap) => {
      this.setState({ cloudProviders: [_.get(configMap, 'data.installerPlatform', null)]});
    });
  }

  render () {
    const {kubernetesVersion, currentTectonicVersion, tectonicVersion, tectonicLicense, cloudProviders } = this.state;

    return <div>
      <SoftwareDetailRow title="Kubernetes"
        detail={kubernetesVersion} text="Kubernetes version could not be determined." />

      <SoftwareDetailRow title="Tectonic" detail={currentTectonicVersion || tectonicVersion}
        text="Tectonic version could not be determined." >
        <div>
          {// eslint-disable-next-line react/jsx-no-target-blank
          } <a href="https://coreos.com/tectonic/releases/" target="_blank" rel="noopener">Release Notes</a>
        </div>
      </SoftwareDetailRow>

      <SoftwareDetailRow title="License" detail={tectonicLicense}
        text="Tectonic License could not be determined." />

      {cloudProviders &&
        <SoftwareDetailRow title="Cloud Provider" detail={cloudProviderNames(cloudProviders)}
          text="Cloud Provider could not be determined." />
      }
    </div>;
  }
}

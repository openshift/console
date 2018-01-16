import * as _ from 'lodash';
import * as React from 'react';

import { FLAGS, connectToFlags } from '../features';
import {coFetchJSON} from '../co-fetch';
import {k8sKinds, k8sGet} from '../module/k8s';
import {k8sVersion} from '../module/status';
import {ClusterOverviewPage} from './cluster-overview';
import {entitlementTitle} from './license-notifier';
import {SafetyFirst} from './safety-first';
import {clusterAppVersionName} from './channel-operators/tectonic-channel';

class ClusterOverviewContainer_ extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      tectonicVersion: null,
      tectonicLicense: null,
      kubernetesVersion: null,
      cloudProviders: null,
      tectonicVersionObj: null,
      currentTectonicVersion: null,
      fixableIssues: null,
      scannedPods: null,
    };
  }

  componentDidMount() {
    super.componentDidMount();
    this._checkTectonicVersion();
    this._checkKubernetesVersion();
    this._checkCloudProvider();
    this._checkAppVersions();
    if (this.props.flags.SECURITY_LABELLER) {
      this._checkFixableIssues();
      this._checkScannedPods();
    }
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.flags.SECURITY_LABELLER || !nextProps.flags.SECURITY_LABELLER) {
      return;
    }
    if (_.isFinite(this.state.fixableIssues) || _.isFinite(this.state.scannedPods)) {
      return;
    }
    this._checkFixableIssues();
    this._checkScannedPods();
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

  _checkFixableIssues() {
    k8sGet(k8sKinds.Pod).then((pods) => {
      let count = 0;
      _.forEach(pods.items, (pod) => {
        const fixables = _.get(pod, 'metadata.labels.secscan/fixables', '0');
        count += parseInt(fixables, 10);
      });
      this.setState({fixableIssues: count});
    });
  }

  _checkScannedPods() {
    k8sGet(k8sKinds.Pod).then((pods) => {
      let count = 0;
      _.forEach(pods.items, (pod) => {
        const scanned = _.get(pod, 'metadata.annotations.secscan/lastScan');
        count += scanned ? 1 : 0;
      });
      this.setState({scannedPods: count});
    });
  }

  render() {
    return <ClusterOverviewPage
      match={this.props.match}
      tectonicVersion={this.state.tectonicVersion}
      tectonicHealth={this.state.tectonicHealth}
      tectonicLicense={this.state.tectonicLicense}
      kubernetesVersion={this.state.kubernetesVersion}
      kubernetesHealth={this.state.kubernetesHealth}
      cloudProviders={this.state.cloudProviders}
      tectonicVersionObj={this.state.tectonicVersionObj}
      currentTectonicVersion={this.state.currentTectonicVersion}
      fixableIssues={this.state.fixableIssues}
      scannedPods={this.state.scannedPods}
    />;
  }
}

export const ClusterOverviewContainer = connectToFlags(FLAGS.SECURITY_LABELLER)(ClusterOverviewContainer_);

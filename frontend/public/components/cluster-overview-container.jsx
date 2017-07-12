import React from 'react';

import {coFetchJSON} from '../co-fetch';
import {k8s, k8sBasePath} from '../module/k8s';
import {k8sVersion} from '../module/status';
import {ClusterOverviewPage} from './cluster-overview';
import {entitlementTitle} from './license-notifier';
import {SafetyFirst} from './safety-first';
import {cloudProviderID} from './utils';
import {clusterAppVersionName} from './channel-operators/tectonic-channel';

export class ClusterOverviewContainer extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      tectonicVersion: null,
      tectonicHealth: null,
      tectonicLicense: null,
      kubernetesVersion: null,
      kubernetesHealth: null,
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
    this._checkTectonicHealth();
    this._checkKubernetesVersion();
    this._checkKubernetesHealth();
    this._checkCloudProvider();
    this._checkAppVersions();
    this._checkFixableIssues();
    this._checkScannedPods();
  }

  _checkTectonicVersion() {
    coFetchJSON('version')
      .then((data) => {
        const license = entitlementTitle(data.entitlementKind, data.entitlementCount);
        this.setState({ tectonicVersion: data.version, tectonicLicense: license, tectonicVersionObj: data });
      })
      .catch(() => this.setState({ tectonicVersion: 'unknown', tectonicLicense: 'unknown' }));
  }

  _checkAppVersions() {
    k8s.appversions.get().then((appversions) => {
      const tectonicTPR = _.find(appversions.items, (a) => a.metadata.name === clusterAppVersionName);
      if (tectonicTPR) {
        this.setState({ currentTectonicVersion: tectonicTPR.status.currentVersion });
      }
    }).catch(() => this.setState({ currentTectonicVersion: null }));
  }

  _checkTectonicHealth() {
    coFetchJSON('health')
      .then(() => this.setState({ tectonicHealth: 'ok' }))
      .catch(() => this.setState({ tectonicHealth: 'unknown' }));
  }

  _checkKubernetesVersion() {
    k8sVersion()
      .then((data) => this.setState({ kubernetesVersion: data.gitVersion }))
      .catch(() => this.setState({ kubernetesVersion: 'unknown' }));
  }

  _checkKubernetesHealth() {
    coFetchJSON(k8sBasePath)
      .then(() => this.setState({ kubernetesHealth: 'ok' }))
      .catch(() => this.setState({ kubernetesHealth: 'unknown' }));
  }

  _checkCloudProvider() {
    k8s.nodes.get().then((nodes) => {
      const providerIDs = _.filter(_.map(nodes.items, cloudProviderID));
      this.setState({ cloudProviders: providerIDs.length ? _.uniq(providerIDs) : null });
    });
  }

  _checkFixableIssues() {
    k8s.pods.get().then((pods) => {
      var count = 0;
      for (var pod of pods.items) {
        var fixables = parseInt(pod['metadata']['labels']['secscan/fixables']);
        count += !fixables ? 0 : fixables;
      }
      this.setState({fixableIssues: count});
    });
  }

  _checkScannedPods() {
    k8s.pods.get().then((pods) => {
      var count = 0;
      for (var pod of pods.items) {
        var scanned = pod['metadata']['annotations']['secscan/lastScan'];
        count += scanned ? 1 : 0;
      }
      this.setState({scannedPods: count});
    });
  }

  render() {
    return <ClusterOverviewPage
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

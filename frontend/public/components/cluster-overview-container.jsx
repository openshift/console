import React from 'react';

import {coFetchJSON} from '../co-fetch';
import {k8s, k8sBasePath} from '../module/k8s';
import {k8sVersion} from '../module/status';
import {ClusterOverviewPage} from './cluster-overview';
import {register} from './react-wrapper';
import {entitlementTitle} from './license-notifier';
import {SafetyFirst} from './safety-first';
import {cloudProviderID} from './utils';

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
      tectonicVersionObj: null
    };
  }

  componentDidMount() {
    super.componentDidMount();
    this._checkTectonicVersion();
    this._checkTectonicHealth();
    this._checkKubernetesVersion();
    this._checkKubernetesHealth();
    this._checkCloudProvider();
  }

  _checkTectonicVersion() {
    coFetchJSON('version')
      .then((data) => {
        const license = entitlementTitle(data.entitlementKind, data.entitlementCount);
        this.setState({ tectonicVersion: data.version, tectonicLicense: license, tectonicVersionObj: data });
      })
      .catch(() => this.setState({ tectonicVersion: 'unknown', tectonicLicense: 'unknown' }));
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

  render() {
    return <ClusterOverviewPage
      tectonicVersion={this.state.tectonicVersion}
      tectonicHealth={this.state.tectonicHealth}
      tectonicLicense={this.state.tectonicLicense}
      kubernetesVersion={this.state.kubernetesVersion}
      kubernetesHealth={this.state.kubernetesHealth}
      cloudProviders={this.state.cloudProviders}
      tectonicVersionObj={this.state.tectonicVersionObj}
    />;
  }
}

register('ClusterOverviewContainer', ClusterOverviewContainer);

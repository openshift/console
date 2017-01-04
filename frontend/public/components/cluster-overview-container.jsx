import React from 'react';

import {coFetchJSON} from './../co-fetch';
import {ClusterOverviewPage} from './cluster-overview';
import {angulars, register} from './react-wrapper';
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
      cloudProviders: null
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
        const license =  entitlementTitle(data.entitlementKind, data.entitlementCount);
        this.setState({ tectonicVersion: data.version, tectonicLicense: license });
      })
      .catch(() => this.setState({ tectonicVersion: 'unknown', tectonicLicense: 'unknown' }));
  }

  _checkTectonicHealth() {
    coFetchJSON('health')
      .then(() => this.setState({ tectonicHealth: 'ok' }))
      .catch(() => this.setState({ tectonicHealth: 'unknown' }));
  }

  _checkKubernetesVersion() {
    const path = `${angulars.k8s.basePath}/version`;
    coFetchJSON(path)
      .then((data) => this.setState({ kubernetesVersion: data.gitVersion }))
      .catch(() => this.setState({ kubernetesVersion: 'unknown' }));
  }

  _checkKubernetesHealth() {
    coFetchJSON(angulars.k8s.basePath)
      .then(() => this.setState({ kubernetesHealth: 'ok' }))
      .catch(() => this.setState({ kubernetesHealth: 'unknown' }));
  }

  _checkCloudProvider() {
    angulars.k8s.nodes.get().then((nodes) => {
      const providerIDs = _.map(nodes.items, cloudProviderID);
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
    />;
  }
}

register('ClusterOverviewContainer', ClusterOverviewContainer);

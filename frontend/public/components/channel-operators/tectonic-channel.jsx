import * as _ from 'lodash-es';
import * as React from 'react';

import {LoadingInline, Firehose, determineOperatorState, StatusBox} from '../utils';
import {AppVersionDetails} from './app-version';
import {SafetyFirst} from '../safety-first';
import * as k8sSelector from '../../module/k8s/selector';

const componentNames = {
  'kubernetes': 'Kubernetes',
  'tectonic-cluster': 'Tectonic',
  'tectonic-etcd': 'tectonic-etcd',
  'tectonic-monitoring': 'tectonic-monitoring'
};

const podNames = {
  'kubernetes': 'kube-version-operator',
  'tectonic-cluster': 'tectonic-channel-operator',
  'tectonic-etcd': 'etcd-operator',
  'tectonic-monitoring': 'tectonic-prometheus-operator'
};

export const clusterAppVersionName = 'tectonic-cluster';

const generateComponents = (components, pods) => {
  return Object.keys(components).reduce((finalComponents, key) => {
    const component = components[key];
    //the component has targetVersion if in the process of an upgrade.
    if (component.currentVersion && (component.desiredVersion || component.targetVersion)) {
      let logsUrl;
      const state = determineOperatorState(component);
      const pod = _.find(pods, p => p.metadata.name.indexOf(podNames[key]) > -1);
      if (pod) {
        logsUrl = `ns/tectonic-system/pods/${pod.metadata.name}/logs`;
      }
      finalComponents[key] = {
        key,
        name: componentNames[key] || key,
        currentVersion: component.currentVersion,
        desiredVersion: component.desiredVersion,
        targetVersion: component.targetVersion,
        pausedSpec: component.pausedSpec,
        pausedStatus: component.pausedStatus,
        taskStatuses: component.taskStatuses,
        failureStatus: component.failureStatus,
        state,
        logsUrl
      };
    }
    return finalComponents;
  }, {});
};

// Consumes component data (TCO third party resources) and
// prepares it for ChannelOperator to display.
// This is responsible for determining which components
// are in use, what state they're in, and what text to display.
// A similar "channel" would be created for CoreOS Linux to
// consume & prepare data.
export class TectonicChannel extends SafetyFirst {
  constructor(props) {
    super(props);
    const selector = k8sSelector.selectorFromString(`k8s-app in (${_.values(podNames).join()})`);
    this.firehoseResources = [
      {
        kind: 'ChannelOperatorConfig',
        namespace: 'tectonic-system',
        isList: true,
        prop: 'configs'
      },
      {
        kind: 'TectonicVersion',
        namespace: 'tectonic-system',
        isList: true,
        prop: 'tectonicVersions'
      },
      {
        kind: 'AppVersion',
        namespace: 'tectonic-system',
        isList: true,
        prop: 'appVersions'
      },
      {
        kind: 'Pod',
        namespace: 'tectonic-system',
        isList: true,
        prop: 'pods',
        selector: selector
      }

    ];
  }

  render() {
    return <Firehose resources={this.firehoseResources}>
      <TectonicChannelWithData />
    </Firehose>;
  }
}

class TectonicChannelWithData extends React.Component {
  _getConfig(configs) {
    if (configs.loaded) {
      return _.get(configs, 'data[0]');
    }

    if (configs.loadError) {
      return {
        loadError : configs.loadError
      };
    }

    return {};
  }

  _getTectonicVersions(versions) {
    if (versions.loaded) {
      return _.get(versions, 'data[0]');
    }

    if (versions.loadError) {
      return {
        loadError : versions.loadError
      };
    }

    return {};
  }

  _getComponents(appVersions, pods) {
    const components = appVersions.data.reduce(this._createComponentFromData.bind(this), {});
    return generateComponents(components, pods.data);
  }

  // Plucks information from third party resources. Uses the
  // desired version from the Tectonic Channel Operator instead
  // of the one on individual operator resources.
  _createComponentFromData(components, component) {
    const name = component.metadata.name;
    const { spec, status } = component;

    components[name] = {
      currentVersion: _.get(status, 'currentVersion'),
      desiredVersion: _.get(spec, 'desiredVersion', null),
      targetVersion: _.get(status, 'targetVersion'),
      pausedSpec: _.get(spec, 'paused'),
      pausedStatus: _.get(status, 'paused'),
      failureStatus: _.get(status, 'failureStatus', null),
      taskStatuses: _.get(status, 'taskStatuses', [])
    };

    return components;
  }

  render() {
    const {configs, pods, appVersions, tectonicVersions} = this.props;
    if (appVersions.loaded) {
      const appVersionList = this._getComponents(appVersions, pods, tectonicVersions);
      const config = this._getConfig(configs);
      const versions = this._getTectonicVersions(tectonicVersions);

      return <div className="co-cluster-updates__component">
        <AppVersionDetails
          primaryOperatorName={clusterAppVersionName}
          appVersionList={appVersionList}
          tectonicVersions={versions}
          config={config} />
      </div>;
    }

    if (appVersions.loadError) {
      return <div className="co-cluster-updates__component">
        <div className="co-cluster-updates__heading--name-wrapper">
          <span className="co-cluster-updates__heading--name">Tectonic</span>
        </div>
        <StatusBox loadError={appVersions.loadError} label="Operators" />
      </div>;
    }

    return <div className="co-cluster-updates__component text-center"><LoadingInline /></div>;
  }
}

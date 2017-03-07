import React from 'react';
import classNames from 'classnames';

import {MultiFirehose, determineOperatorState} from '../utils';
import {ChannelOperator} from './channel-operator';
import {SafetyFirst} from '../safety-first';
import * as k8sSelector from '../../module/k8s/selector';

const componentNames = {
  'kubernetes': 'Kubernetes',
  'tectonic-cluster': 'Tectonic'
};

const podNames = {
  'kubernetes': 'kube-version-operator',
  'tectonic-cluster': 'tectonic-channel-operator'
};

const clusterAppVersionName = 'tectonic-cluster';

const generateComponents = (components, pods) => {
  return Object.keys(components).reduce((finalComponents, key) => {
    const component = components[key];

    //the component has targetVersion if in the process of an upgrade.
    if (component.currentVersion && (component.desiredVersion || component.targetVersion)) {
      let logsUrl;
      const name = componentNames[key] || key;
      const headerText = <span>{name} {component.currentVersion} &#10141; {component.desiredVersion || component.targetVersion}</span>;
      const state = determineOperatorState(component);
      const pod = _.find(pods, p => p.metadata.name.indexOf(podNames[key]) > -1);
      if (pod) {
        logsUrl = `ns/tectonic-system/pods/${pod.metadata.name}/logs`;
      }
      finalComponents[key] = {
        currentVersion: component.currentVersion,
        desiredVersion: component.desiredVersion,
        targetVersion: component.targetVersion,
        pausedSpec: component.pausedSpec,
        pausedStatus: component.pausedStatus,
        taskStatuses: component.taskStatuses,
        failureStatus: component.failureStatus,
        state,
        logsUrl,
        headerText
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
    const selector = k8sSelector.fromString(`k8s-app in (${_.values(podNames).join()})`);
    this.firehoseResources = [
      {
        kind: 'channeloperatorconfig',
        namespace: 'tectonic-system',
        isList: true,
        prop: 'configs'
      },
      {
        kind: 'appversion',
        namespace: 'tectonic-system',
        isList: true,
        prop: 'appVersions'
      },
      {
        kind: 'pod',
        namespace: 'tectonic-system',
        isList: true,
        prop: 'pods',
        selector: selector
      }

    ];
  }

  render() {
    return <MultiFirehose resources={this.firehoseResources}>
      <TectonicChannelWithData {...this.props} />
    </MultiFirehose>;
  }
}
TectonicChannel.propTypes = {
  last: React.PropTypes.bool
};

class TectonicChannelWithData extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      config: null,
      components: null
    };
  }

  componentWillReceiveProps(nextProps) {
    const newState = {};

    if (nextProps.configs.loaded) {
      newState.config = _.get(nextProps.configs, 'data[0]');
    }

    if (nextProps.appVersions.loaded && nextProps.pods.loaded) {
      const components = nextProps.appVersions.data.reduce(this._createComponentFromData.bind(this), {});
      newState.components = generateComponents(components, nextProps.pods.data);
    }

    if (nextProps.configs.loadError) {
      newState.config = {
        loadError : nextProps.configs.loadError
      };
    }

    if (nextProps.appVersions.loadError) {
      newState.components = {
        loadError: nextProps.appVersions.loadError
      };
    }


    this.setState(newState);
  }

  // Plucks information from third party resources. Uses the
  // desired version from the Tectonic Channel Operator instead
  // of the one on individual operator resources.
  _createComponentFromData(components, component) {
    const name = component.metadata.name;

    components[name] = {
      currentVersion: component.status.currentVersion,
      desiredVersion: _.get(component.spec, 'desiredVersion', null),
      targetVersion: component.status.targetVersion,
      pausedSpec: component.spec.paused,
      pausedStatus: component.status.paused,
      failureStatus: _.get(component.status, 'failureStatus', null),
      taskStatuses: _.get(component.status, 'taskStatuses', [])
    };

    return components;
  }

  render() {
    return <div className={classNames('co-cluster-updates__component', {'co-cluster-updates__component--last': this.props.last})}>
      {this.state.config && this.state.components &&
        <ChannelOperator
          primaryOperatorName={clusterAppVersionName}
          components={this.state.components}
          config={this.state.config} />
      }
    </div>;
  }
}

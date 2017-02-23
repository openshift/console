import React from 'react';

import {MultiFirehose} from '../utils';
import {ChannelOperator, componentStates} from './channel-operator';
import {SafetyFirst} from '../safety-first';

const componentNames = {
  'kubernetes': 'Kubernetes',
  'tectonic-cluster': 'Tectonic'
};

const clusterAppVersionName = 'tectonic-cluster';

// Consumes component data (TCO third party resources) and
// prepares it for ChannelOperator to display.
// This is responsible for determining which components
// are in use, what state they're in, and what text to display.
// A similar "channel" would be created for CoreOS Linux to
// consume & prepare data.
export class TectonicChannel extends SafetyFirst {
  constructor(props) {
    super(props);

    this.firehoseResources = [
      {
        kind: 'tectonicversion',
        namespace: 'tectonic-system',
        isList: true,
        prop: 'tectonicVersions'
      },
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
  expanded: React.PropTypes.bool,
  last: React.PropTypes.bool
};

class TectonicChannelWithData extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tectonicVersion: {},
      config: null,
      components: {}
    };
  }

  componentWillReceiveProps(nextProps) {
    const newState = {};

    if (nextProps.configs.loaded) {
      newState.config = _.get(nextProps.configs, 'data[0]');
    }

    if (nextProps.appVersions.loaded && nextProps.tectonicVersions.loaded) {
      const tectonicAppVersion = _.find(nextProps.appVersions.data, ['metadata.name', clusterAppVersionName]);
      const currentVersion = _.get(tectonicAppVersion, 'spec.desiredVersion', '');
      newState.tectonicVersion = _.find(nextProps.tectonicVersions.data, ['version', currentVersion]) || this.state.tectonicVersion || {};

      const desiredVersions = newState.tectonicVersion.desiredVersions || [];
      newState.components = nextProps.appVersions.data.reduce(this._createComponentFromData.bind(this, desiredVersions), {});
    }

    this.setState(newState);
  }

  // Plucks information from third party resources. Uses the
  // desired version from the Tectonic Channel Operator instead
  // of the one on individual operator resources.
  _createComponentFromData(desiredVersions, components, component) {
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

  _generateComponents() {
    return Object.keys(this.state.components).reduce((finalComponents, key) => {
      const component = this.state.components[key];

      //the component has targetVersion if in the process of an upgrade.
      if (component.currentVersion && (component.desiredVersion || component.targetVersion)) {
        let state, logsUrl;
        const name = componentNames[key] || key;
        const headerText = <span>{name} {component.currentVersion} &#10141; {component.desiredVersion || component.targetVersion}</span>;

        if (component.failureStatus) {
          state = componentStates.FAILED;
        } else if (component.targetVersion) {
          // logsUrl = '#'; TODO: set this url
          state = componentStates.UPDATING;
        } else if (component.currentVersion !== component.desiredVersion) {
          state = componentStates.PENDING;
        } else {
          state = componentStates.COMPLETE;
        }

        if (component.pausedStatus) {
          state = componentStates.PAUSED;
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
  }

  render() {
    return <ChannelOperator type="Tectonic" primaryComponent={clusterAppVersionName} components={this._generateComponents()} config={this.state.config} last={this.props.last} expanded={this.props.expanded} />;
  }
}

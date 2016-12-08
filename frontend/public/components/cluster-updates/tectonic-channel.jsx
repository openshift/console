import React from 'react';
import {Provider} from 'react-redux';

import {angulars} from '../react-wrapper';
import {MultiFirehose} from '../utils';
import {ChannelOperator, componentStates} from './channel-operator';

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
export class TectonicChannel extends React.Component {
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
    return <Provider store={angulars.store}>
      <MultiFirehose resources={this.firehoseResources}>
        <TectonicChannelWithData {...this.props} />
      </MultiFirehose>
    </Provider>;
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

    let desiredVersion;
    if (name === clusterAppVersionName) {
      desiredVersion = component.spec.desiredVersion;
    } else {
      desiredVersion = _.get(_.find(desiredVersions, ['name', name]), 'version');
    }

    components[name] = {
      currentVersion: component.status.currentVersion,
      desiredVersion,
      targetVersion: component.status.targetVersion,
      pausedSpec: component.spec.paused,
      pausedStatus: component.status.paused
    };

    return components;
  }

  _generateComponents() {
    return Object.keys(this.state.components).reduce((finalComponents, key) => {
      const component = this.state.components[key];

      if (component.currentVersion && component.desiredVersion) {
        let state, text, logsUrl;
        const name = componentNames[key] || key;
        if (component.targetVersion) {
          // logsUrl = '#'; TODO: set this url
          state = componentStates.UPDATING;
          text = <span>Update {name}<br />{component.currentVersion} &#10141; {component.desiredVersion}</span>;
        } else if (component.currentVersion !== component.desiredVersion) {
          state = componentStates.PENDING;
          text = <span>Update {name}<br />{component.currentVersion} &#10141; {component.desiredVersion}</span>;
        } else {
          state = componentStates.COMPLETE;
          text = `${name} ${component.currentVersion}`;
        }

        if (component.pausedStatus) {
          state = componentStates.PAUSED;
          text = <span>{text}<br /><span className="text-muted">Updates paused</span></span>;
        }

        finalComponents[key] = {
          currentVersion: component.currentVersion,
          desiredVersion: component.desiredVersion,
          targetVersion: component.targetVersion,
          pausedSpec: component.pausedSpec,
          pausedStatus: component.pausedStatus,
          state,
          text,
          logsUrl
        };
      }

      return finalComponents;
    }, {});
  }

  render() {
    return <ChannelOperator type="Tectonic" primaryComponent={clusterAppVersionName} components={this._generateComponents()} config={this.state.config} last={this.props.last} expanded={this.props.expanded} />;
  }
}

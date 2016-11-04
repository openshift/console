import React from 'react';
import {Provider} from 'react-redux';

import {angulars} from '../react-wrapper';
import {MultiFirehose} from '../utils';
import {ChannelOperator, componentStates} from './channel-operator';

const componentNames = {
  'etcd-cluster': 'etcd',
  'kube-version-update': 'Kubernetes',
  'tectonic-channel-controller-version-update': 'Tectonic Channel'
};

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
        k8sResource: angulars.k8s.tectonicchannelcontrollerclusterspecs,
        namespace: 'tectonic-system',
        isList: true,
        prop: 'clusterSpec'
      },
      {
        k8sResource: angulars.k8s.tectonicchannelcontrollerconfigs,
        namespace: 'tectonic-system',
        isList: true,
        prop: 'config'
      },
      {
        k8sResource: angulars.k8s.tectonicversionupdates,
        namespace: 'tectonic-system',
        isList: true,
        prop: 'versionUpdates'
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
      clusterSpec: {},
      config: null,
      components: {}
    };
  }

  componentWillReceiveProps(nextProps) {
    const newState = {};

    ['config', 'clusterSpec'].forEach((field) => {
      if (nextProps[field].loaded) {
        newState[field] = _.get(nextProps[field], 'data[0]');
      }
    });

    if (nextProps.versionUpdates.loaded) {
      const clusterSpec = newState.clusterSpec || this.state.clusterSpec || {};
      const desiredVersions = clusterSpec.desiredVersions || [];
      newState.components = nextProps.versionUpdates.data.reduce(this._createComponentFromData.bind(this, desiredVersions), {});
    }

    this.setState(newState);
  }

  // Plucks information from third party resources. Uses the
  // desired version from the Tectonic Channel Operator instead
  // of the one on individual controller resources.
  _createComponentFromData(desiredVersions, components, component) {
    const name = component.metadata.name;

    let desiredVersion;
    if (name === 'tectonic-channel-controller-version-update') {
      desiredVersion = component.spec.desiredVersion;
    } else {
      desiredVersion = _.get(_.find(desiredVersions, ['name', name]), 'version');
    }

    components[name] = {
      currentVersion: component.status.currentVersion,
      desiredVersion,
      targetVersion: component.status.targetVersion,
      paused: component.status.paused
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

        if (component.paused) {
          state = componentStates.PAUSED;
          text = <span>{text}<br /><span className="text-muted">Updates paused</span></span>;
        }

        finalComponents[key] = {
          currentVersion: component.currentVersion,
          desiredVersion: component.desiredVersion,
          targetVersion: component.targetVersion,
          paused: component.paused,
          state,
          text,
          logsUrl
        };
      }

      return finalComponents;
    }, {});
  }

  render() {
    return <ChannelOperator type="Tectonic" primaryComponent="tectonic-channel-controller-version-update" components={this._generateComponents()} config={this.state.config} last={this.props.last} expanded={this.props.expanded} />;
  }
}

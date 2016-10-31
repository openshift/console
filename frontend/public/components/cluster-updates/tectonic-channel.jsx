import React from 'react';
import {Provider} from 'react-redux';

import {angulars} from '../react-wrapper';
import {Firehose} from '../utils';
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
  render() {
    return <Provider store={angulars.store}>
      <Firehose k8sResource={angulars.k8s.tectonicchannelcontrollerclusterspecs} namespace="tectonic-system" isList={true}>
        <TectonicChannelWithClusterSpecs last={this.props.last} expanded={this.props.expanded} />
      </Firehose>
    </Provider>;
  }
}

export class TectonicChannelWithClusterSpecs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clusterSpec: {}
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.loaded) {
      this.setState({
        clusterSpec: _.get(nextProps, 'data[0]') || {}
      });
    }
  }

  render() {
    return <Provider store={angulars.store}>
      <Firehose k8sResource={angulars.k8s.tectonicversionupdates} namespace="tectonic-system" isList={true}>
        <TectonicChannelWithStatuses clusterSpec={this.state.clusterSpec} last={this.props.last} expanded={this.props.expanded} />
      </Firehose>
    </Provider>;
  }
}

export class TectonicChannelWithStatuses extends React.Component {
  constructor(props) {
    super(props);

    this._isMounted = false;
    this.state = {
      components: {}
    };
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.loaded) {
      const desiredVersions = nextProps.clusterSpec.desiredVersions || [];
      this.setState({
        components: nextProps.data.reduce(this._createComponentFromData.bind(this, desiredVersions), {})
      });
    }
    // TODO: handle errors (props.loadError from Firehose)
  }

  componentWillUnmount() {
    this._isMounted = false;
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
    const components = this._generateComponents();
    return <Provider store={angulars.store}>
      <Firehose k8sResource={angulars.k8s.tectonicchannelcontrollerconfigs} namespace="tectonic-system" isList={true}>
        <TectonicChannelWithConfigs type="Tectonic" primaryComponent="tectonic-channel-controller-version-update" components={components} last={this.props.last} expanded={this.props.expanded} />
      </Firehose>
    </Provider>;
  }
}
TectonicChannelWithStatuses.propTypes = {
  last: React.PropTypes.bool,
  expanded: React.PropTypes.bool
};

class TectonicChannelWithConfigs extends React.Component {
  render() {
    const props = _.pick(this.props, ['type', 'primaryComponent', 'components', 'last', 'expanded']);
    const config = {
      data: _.get(this.props, 'data[0]'),
      loaded: this.props.loaded
    };

    return <ChannelOperator config={config} {...props} />;
  }
}
TectonicChannelWithConfigs.propTypes = {
  components: React.PropTypes.object,
  data: React.PropTypes.array,
  last: React.PropTypes.bool,
  loaded: React.PropTypes.bool,
  primaryComponent: React.PropTypes.string,
  type: React.PropTypes.string
};

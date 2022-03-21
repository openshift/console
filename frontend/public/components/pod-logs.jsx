import * as _ from 'lodash-es';
import * as React from 'react';

import {
  ContainerDropdown,
  getQueryArgument,
  LOG_SOURCE_RESTARTING,
  LOG_SOURCE_RUNNING,
  LOG_SOURCE_TERMINATED,
  LOG_SOURCE_WAITING,
  ResourceLog,
  setQueryArgument,
} from './utils';

const containersToStatuses = ({ status }, containers) => {
  return _.reduce(
    containers,
    (accumulator, { name }, order) => {
      const containerStatus =
        _.find(status.containerStatuses, { name }) ||
        _.find(status.initContainerStatuses, { name });
      if (containerStatus) {
        return {
          ...accumulator,
          [name]: { ...containerStatus, order },
        };
      }
      return accumulator;
    },
    {},
  );
};

const containerToLogSourceStatus = (container) => {
  if (!container) {
    return LOG_SOURCE_WAITING;
  }

  const { state, lastState } = container;

  if (state.waiting && !_.isEmpty(lastState)) {
    return LOG_SOURCE_RESTARTING;
  }

  if (state.waiting) {
    return LOG_SOURCE_WAITING;
  }

  if (state.terminated) {
    return LOG_SOURCE_TERMINATED;
  }

  return LOG_SOURCE_RUNNING;
};

export class PodLogs extends React.Component {
  constructor(props) {
    super(props);
    this._selectContainer = this._selectContainer.bind(this);
    this.state = {
      containers: {},
      currentKey: getQueryArgument('container') || '',
      initContainers: {},
    };
  }

  static getDerivedStateFromProps({ obj }, { currentKey }) {
    const newState = {};
    const containers = _.get(obj, 'spec.containers', []);
    const initContainers = _.get(obj, 'spec.initContainers', []);
    newState.containers = containersToStatuses(obj, containers);
    newState.initContainers = containersToStatuses(obj, initContainers);
    if (!currentKey) {
      const defaultContainer =
        obj.metadata.annotations?.['kubectl.kubernetes.io/default-container'];
      const selected =
        newState.containers[defaultContainer] || _.find(newState.containers, { order: 0 });
      newState.currentKey = selected?.name || '';
    }
    return newState;
  }

  _selectContainer(name) {
    this.setState({ currentKey: name }, () => {
      setQueryArgument('container', this.state.currentKey);
    });
  }

  render() {
    const { containers, currentKey, initContainers } = this.state;
    const currentContainer = _.get(containers, currentKey) || _.get(initContainers, currentKey);
    const currentContainerStatus = containerToLogSourceStatus(currentContainer);
    const containerDropdown = (
      <ContainerDropdown
        currentKey={currentKey}
        containers={containers}
        initContainers={initContainers}
        onChange={this._selectContainer}
      />
    );

    return (
      <div className="co-m-pane__body co-m-pane__body--full-height">
        <ResourceLog
          containerName={currentContainer ? currentContainer.name : ''}
          dropdown={containerDropdown}
          resource={this.props.obj}
          resourceStatus={currentContainerStatus}
        />
      </div>
    );
  }
}

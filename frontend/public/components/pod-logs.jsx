import * as _ from 'lodash-es';
import * as React from 'react';

import { ContainerDropdown, ResourceLog, LOG_SOURCE_RESTARTING, LOG_SOURCE_WAITING, LOG_SOURCE_RUNNING, LOG_SOURCE_TERMINATED } from './utils';

const reduceContainerStatuses = (accumulator, container, order) => ({
  ...accumulator,
  [container.name]: { ...container, order }
});

const containerToLogSourceStatus = ({state, lastState}) => {
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
      currentKey: '',
      initContainers: {},
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const newState = {};
    const containerStatuses = _.get(nextProps.obj, 'status.containerStatuses', []);
    const initContainerStatuses = _.get(nextProps.obj, 'status.initContainerStatuses', []);
    newState.containers = _.reduce(containerStatuses, reduceContainerStatuses, {});
    newState.initContainers = _.reduce(initContainerStatuses, reduceContainerStatuses, {});
    if (!prevState.currentKey) {
      const firstContainer = _.find(newState.containers, { order: 0 });
      newState.currentKey = firstContainer.name;
    }
    return newState;
  }

  _selectContainer(name) {
    this.setState({currentKey: name});
  }

  render() {
    const {containers, currentKey, initContainers} = this.state;
    const namespace = _.get(this.props.obj, 'metadata.namespace');
    const podName = _.get(this.props.obj, 'metadata.name');
    const currentContainer = _.get(containers, currentKey) || _.get(initContainers, currentKey);
    const currentContainerStatus = containerToLogSourceStatus(currentContainer);
    const containerDropdown = <ContainerDropdown
      currentKey={currentKey}
      containers={containers}
      initContainers={initContainers}
      onChange={this._selectContainer} />;

    return <div className="co-m-pane__body">
      <ResourceLog
        containerName={currentContainer.name}
        kind="Pod"
        dropdown={containerDropdown}
        namespace={namespace}
        resourceName={podName}
        resourceStatus={currentContainerStatus}
      />
    </div>;
  }
}

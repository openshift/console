import * as _ from 'lodash-es';
import * as React from 'react';

import { Dropdown, ResourceLog, ResourceName } from './utils';

// Component to container dropdown or conatiner name if only one container in pod.
const ContainerDropdown = ({currentContainer, containers, kind, onChange}) => {
  const resourceName = (container) => {
    return <ResourceName name={container.name} kind={kind} />;
  };
  const dropdownItems = _.mapValues(containers, resourceName);
  return <Dropdown
    className="btn-group"
    items={dropdownItems}
    title={resourceName(currentContainer)}
    onChange={onChange} />;
};

export class PodLogs extends React.Component {
  constructor(props) {
    super(props);
    this._selectContainer = this._selectContainer.bind(this);
    this.state = {
      containers: [],
      currentKey: ''
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const newState = {};
    const containers = _.get(nextProps.obj, 'status.containerStatuses', []);
    const initContainers = _.get(nextProps.obj, 'status.initContainerStatuses', []);
    const allContainers = containers.concat(initContainers);
    newState.containers = _.reduce(allContainers, (accumulator, {name, state}, index) => {
      return {
        ...accumulator,
        [name]: {
          alive: _.has(state, 'running'),
          name,
          order: index
        }
      };
    }, {});

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
    const {containers, currentKey} = this.state;
    const namespace = _.get(this.props.obj, 'metadata.namespace');
    const podName = _.get(this.props.obj, 'metadata.name');
    const currentContainer = _.get(containers, currentKey);
    const containerDropdown = <ContainerDropdown
      currentContainer={currentContainer}
      containers={containers}
      kind="Container"
      onChange={this._selectContainer} />;

    return <div className="co-m-pane__body">
      <ResourceLog
        alive={currentContainer.alive}
        containerName={currentContainer.name}
        kind="Pod"
        dropdown={containerDropdown}
        namespace={namespace}
        resourceName={podName} />
    </div>;
  }
}

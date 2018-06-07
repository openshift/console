import * as _ from 'lodash-es';
import * as React from 'react';

import { Dropdown, LoadingInline, ResourceLog, ResourceName } from './utils';

// Component to container dropdown or conatiner name if only one container in pod.
const ContainerDropdown = ({currentContainer, containers, kind, onChange}) => {
  const resourceName = (container) => <ResourceName name={container.name || <LoadingInline />} kind={kind} />;
  const dropdownItems = _.mapValues(containers, resourceName);
  return <Dropdown className="btn-group" items={dropdownItems} title={resourceName(currentContainer)} onChange={onChange} />;
};

export class PodLogs extends React.Component {
  constructor(props) {
    super(props);
    this._selectContainer = this._selectContainer.bind(this);

    this.state = {
      containers: [],
      currentContainer: null,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const newState = {};
    const containers = _.get(nextProps.obj, 'status.containerStatuses', []);
    newState.containers = _.map(containers, (container) => {
      return {
        name: container.name,
        eof: !_.isEmpty(container.state.terminated)
      };
    });

    newState.currentContainer = prevState.currentContainer || newState.containers[0];
    if ( !_.isEqual(prevState.currentContainer, newState.currentContainer)
        || !_.isEqual(prevState.containers, newState.containers)) {
      return newState;
    }
    return null;
  }

  _selectContainer(index) {
    const currentContainer = this.state.containers[index];
    this.setState({currentContainer});
  }

  render() {
    const {currentContainer, containers} = this.state;
    const namespace = _.get(this.props.obj, 'metadata.namespace');
    const podName = _.get(this.props.obj, 'metadata.name');
    const containerDropdown = <ContainerDropdown
      currentContainer={currentContainer}
      containers={containers}
      kind="Container"
      onChange={this._selectContainer} />;

    return <div className="co-m-pane__body">
      <ResourceLog
        containerName={currentContainer.name}
        eof={currentContainer.eof}
        kind="Pod"
        dropdown={containerDropdown}
        namespace={namespace}
        resourceName={podName} />
    </div>;
  }
}

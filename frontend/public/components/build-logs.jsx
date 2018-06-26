import * as _ from 'lodash-es';
import * as React from 'react';
import { ResourceLog, LOG_SOURCE_RUNNING, LOG_SOURCE_TERMINATED, LOG_SOURCE_WAITING } from './utils';

const buildToLogSourceStatus = (phase) => {
  switch (phase) {

    case 'New':
    case 'Pending':
      return LOG_SOURCE_WAITING;
    case 'Cancelled':
    case 'Complete':
    case 'Error':
    case 'Failed':
      return LOG_SOURCE_TERMINATED;

    default:
      return LOG_SOURCE_RUNNING;
  }
};

export class BuildLogs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: LOG_SOURCE_WAITING
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const phase = _.get(nextProps.obj, 'status.phase');
    const status = buildToLogSourceStatus(phase);
    if (prevState.status !== status){
      return {status};
    }
    return null;
  }

  render() {
    const namespace = _.get(this.props.obj, 'metadata.namespace');
    const buildName = _.get(this.props.obj, 'metadata.name');
    return <div className="co-m-pane__body">
      <ResourceLog
        kind="Build"
        namespace={namespace}
        resourceName={buildName}
        resourceStatus={this.state.status}
      />
    </div>;
  }
}

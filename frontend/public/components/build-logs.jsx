import * as _ from 'lodash-es';
import * as React from 'react';

import { ResourceLog } from './utils';

export class BuildLogs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      alive: true
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const alive = _.get(nextProps.obj, 'status.phase') === 'Running';
    if (prevState.alive !== alive){
      return {alive};
    }
    return null;
  }

  render() {
    const namespace = _.get(this.props.obj, 'metadata.namespace');
    const buildName = _.get(this.props.obj, 'metadata.name');
    return <div className="co-m-pane__body">
      <ResourceLog
        alive={this.state.alive}
        kind="Build"
        namespace={namespace}
        resourceName={buildName} />
    </div>;
  }
}

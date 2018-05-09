import * as _ from 'lodash-es';
import * as React from 'react';

import { ResourceLog } from './utils';

export class BuildLogs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      eof: false
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const eof = ['Complete', 'Failed', 'Error', 'Cancelled'].includes(_.get(nextProps.obj, 'status.phase'));
    if (prevState.eof !== eof){
      return {eof};
    }
    return null;
  }

  render() {
    const namespace = _.get(this.props.obj, 'metadata.namespace');
    const buildName = _.get(this.props.obj, 'metadata.name');
    return <div className="co-m-pane__body">
      <ResourceLog
        eof={this.state.eof}
        kind="Build"
        namespace={namespace}
        resourceName={buildName} />
    </div>;
  }
}

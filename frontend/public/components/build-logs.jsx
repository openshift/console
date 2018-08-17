import * as _ from 'lodash-es';
import * as React from 'react';
import { LOG_SOURCE_RUNNING, LOG_SOURCE_TERMINATED, LOG_SOURCE_WAITING, MsgBox, ResourceLog } from './utils';
import { getJenkinsLogURL } from './build-pipeline';
import { BuildStrategyType } from './build';

const PipelineLogMessage = ({ build }) => {
  const logURL = getJenkinsLogURL(build);
  const message = logURL
    ? 'Pipeline build logs are available through Jenkins (linked below)'
    : 'A link to the Jenkins pipeline build logs will appear below when the build starts';

  const detail = <React.Fragment>
    <p>{message}</p>
    { logURL && <a href={logURL} target="_blank" rel="noopener noreferrer">View Log</a> }
  </React.Fragment>;

  return <MsgBox title="See Jenkins Log" detail={detail} />;
};

const buildPhaseToLogSourceStatus = (phase) => {
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

  static getDerivedStateFromProps({ obj: build }, { status: prevStatus }) {
    const phase = _.get(build, 'status.phase');
    const status = buildPhaseToLogSourceStatus(phase);
    return prevStatus !== status ? {status} : null;
  }

  render() {
    const { obj: build } = this.props;
    const { name, namespace } = build.metadata;
    const isPipeline = _.get(build, 'spec.strategy.type') === BuildStrategyType.JenkinsPipeline;

    return <div className="co-m-pane__body">
      { isPipeline
        ? <PipelineLogMessage build={build} />
        : <ResourceLog
          kind="Build"
          namespace={namespace}
          resourceName={name}
          resourceStatus={this.state.status}
        />
      }
    </div>;
  }
}

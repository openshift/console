import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LOG_SOURCE_RUNNING,
  LOG_SOURCE_TERMINATED,
  LOG_SOURCE_WAITING,
  MsgBox,
  ResourceLog,
} from './utils';
import { getJenkinsLogURL, BuildPipelineLogLink } from './build-pipeline';
import { BuildStrategyType } from './build';
import { BuildPhase } from '../module/k8s/builds';

const PipelineLogMessage = ({ build }) => {
  const { t } = useTranslation();
  const logURL = getJenkinsLogURL(build);
  const message = logURL
    ? t('public~Pipeline build logs are available through Jenkins (linked below)')
    : t('public~A link to the Jenkins pipeline build logs will appear below when the build starts');

  const detail = (
    <>
      <p>{message}</p>
      <BuildPipelineLogLink obj={build} />
    </>
  );

  return <MsgBox title={t('public~See Jenkins log')} detail={detail} />;
};

const buildPhaseToLogSourceStatus = (phase) => {
  switch (phase) {
    case BuildPhase.New:
    case BuildPhase.Pending:
      return LOG_SOURCE_WAITING;

    case BuildPhase.Cancelled:
    case BuildPhase.Complete:
    case BuildPhase.Error:
    case BuildPhase.Failed:
      return LOG_SOURCE_TERMINATED;

    default:
      return LOG_SOURCE_RUNNING;
  }
};

export class BuildLogs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: LOG_SOURCE_WAITING,
    };
  }

  static getDerivedStateFromProps({ obj: build }, { status: prevStatus }) {
    const phase = _.get(build, 'status.phase');
    const status = buildPhaseToLogSourceStatus(phase);
    return prevStatus !== status ? { status } : null;
  }

  render() {
    const { obj: build } = this.props;
    const isPipeline = _.get(build, 'spec.strategy.type') === BuildStrategyType.JenkinsPipeline;

    return (
      <div className="co-m-pane__body">
        {isPipeline ? (
          <PipelineLogMessage build={build} />
        ) : (
          <ResourceLog resource={build} resourceStatus={this.state.status} />
        )}
      </div>
    );
  }
}

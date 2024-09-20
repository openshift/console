import * as React from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { withTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom-v5-compat';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { PipelineRunModel } from '../../../models';
import { ComputedStatus, PipelineRunKind, PipelineTask, TaskRunKind } from '../../../types';
import { pipelineRunStatus } from '../../../utils/pipeline-filter-reducer';
import { taskRunStatus } from '../../../utils/pipeline-utils';
import { TektonResourceLabel } from '../../pipelines/const';
import { ColoredStatusIcon } from '../../pipelines/detail-page-tabs/pipeline-details/StatusIcon';
import { useTaskRuns } from '../hooks/useTaskRuns';
import { ErrorDetailsWithStaticLog } from '../logs/log-snippet-types';
import { getDownloadAllLogsCallback } from '../logs/logs-utils';
import LogsWrapperComponent from '../logs/LogsWrapperComponent';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import './PipelineRunLogs.scss';

interface PipelineRunLogsProps {
  obj: PipelineRunKind;
  activeTask?: string;
  t: TFunction;
  taskRuns: TaskRunKind[];
}
interface PipelineRunLogsState {
  activeItem: string;
  navUntouched: boolean;
}
class PipelineRunLogsWithTranslation extends React.Component<
  PipelineRunLogsProps,
  PipelineRunLogsState
> {
  constructor(props) {
    super(props);
    this.state = { activeItem: null, navUntouched: true };
  }

  componentDidMount() {
    const { activeTask, taskRuns, obj } = this.props;
    const sortedTaskRuns = this.getSortedTaskRun(taskRuns, [
      ...(obj?.status?.pipelineSpec?.tasks || []),
      ...(obj?.status?.pipelineSpec?.finally || []),
    ]);
    const activeItem = this.getActiveTaskRun(sortedTaskRuns, activeTask);
    this.setState({ activeItem });
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.obj !== nextProps.obj || this.props.taskRuns !== nextProps.taskRuns) {
      const { activeTask, taskRuns } = nextProps;
      const sortedTaskRuns = this.getSortedTaskRun(taskRuns, [
        ...(this.props?.obj?.status?.pipelineSpec?.tasks || []),
        ...(this.props?.obj?.status?.pipelineSpec?.finally || []),
      ]);
      const activeItem = this.getActiveTaskRun(sortedTaskRuns, activeTask);
      this.state.navUntouched && this.setState({ activeItem });
    }
  }

  getActiveTaskRun = (taskRuns: TaskRunKind[], activeTask: string): string => {
    const activeTaskRun = activeTask
      ? taskRuns.find((taskRun) => taskRun.metadata.name.includes(activeTask))
      : taskRuns.find((taskRun) => taskRunStatus(taskRun) === ComputedStatus.Failed) ||
        taskRuns[taskRuns.length - 1];

    return activeTaskRun?.metadata.name;
  };

  getSortedTaskRun = (tRuns: TaskRunKind[], tasks: PipelineTask[]): TaskRunKind[] => {
    const taskRuns = tRuns?.sort((a, b) => {
      if (_.get(a, ['status', 'completionTime'], false)) {
        return b.status?.completionTime &&
          new Date(a.status.completionTime) > new Date(b.status.completionTime)
          ? 1
          : -1;
      }
      return b.status?.completionTime ||
        new Date(a.status?.startTime) > new Date(b.status?.startTime)
        ? 1
        : -1;
    });

    const pipelineTaskNames = tasks?.map((t) => t?.name);
    return (
      taskRuns?.sort(
        (c, d) =>
          pipelineTaskNames?.indexOf(c?.metadata?.labels?.[TektonResourceLabel.pipelineTask]) -
          pipelineTaskNames?.indexOf(d?.metadata?.labels?.[TektonResourceLabel.pipelineTask]),
      ) || []
    );
  };

  onNavSelect = (e, item) => {
    this.setState({
      activeItem: item.itemId,
      navUntouched: false,
    });
  };

  render() {
    const { obj, t, taskRuns: tRuns } = this.props;
    const { activeItem } = this.state;
    const taskRunNames = this.getSortedTaskRun(tRuns, [
      ...(obj?.status?.pipelineSpec?.tasks || []),
      ...(obj?.status?.pipelineSpec?.finally || []),
    ])?.map((tRun) => tRun.metadata.name);

    const logDetails = getPLRLogSnippet(obj, tRuns) as ErrorDetailsWithStaticLog;
    const pipelineStatus = pipelineRunStatus(obj);
    const taskCount = taskRunNames.length;
    const downloadAllCallback =
      taskCount > 1
        ? getDownloadAllLogsCallback(
            taskRunNames,
            tRuns,
            obj.metadata?.namespace,
            obj.metadata?.name,
          )
        : undefined;
    const activeTaskRun = tRuns.find((taskRun) => taskRun.metadata.name === activeItem);
    const podName = activeTaskRun?.status?.podName;
    const taskName = activeTaskRun?.metadata?.labels?.[TektonResourceLabel.pipelineTask] || '-';
    const pipelineRunFinished = pipelineStatus !== ComputedStatus.Running;
    const resources: WatchK8sResource = taskCount > 0 &&
      podName && {
        name: podName,
        kind: 'Pod',
        namespace: obj.metadata.namespace,
        isList: false,
      };
    const waitingForPods = !!(activeItem && !resources);

    const selectedItemRef = (item: HTMLSpanElement) => {
      if (item?.scrollIntoView) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    const logsPath = `${resourcePathFromModel(
      PipelineRunModel,
      obj.metadata.name,
      obj.metadata.namespace,
    )}/logs`;

    return (
      <div className="odc-pipeline-run-logs">
        <div className="odc-pipeline-run-logs__tasklist" data-test-id="logs-tasklist">
          {taskCount > 0 ? (
            <Nav onSelect={this.onNavSelect} theme="light">
              <NavList className="odc-pipeline-run-logs__nav">
                {taskRunNames.map((taskRunName) => {
                  const taskRun = tRuns.find((tRun) => tRun.metadata.name === taskRunName);
                  return (
                    <NavItem
                      key={taskRunName}
                      itemId={taskRunName}
                      isActive={activeItem === taskRunName}
                      className="odc-pipeline-run-logs__navitem"
                    >
                      <Link
                        to={`${logsPath}?taskName=${
                          taskRun?.metadata?.labels?.[TektonResourceLabel.pipelineTask] || '-'
                        }`}
                      >
                        <ColoredStatusIcon status={taskRunStatus(taskRun)} />
                        <span
                          className="odc-pipeline-run-logs__namespan"
                          ref={activeItem === taskRunName ? selectedItemRef : undefined}
                        >
                          {taskRun?.metadata?.labels?.[TektonResourceLabel.pipelineTask] || '-'}
                        </span>
                      </Link>
                    </NavItem>
                  );
                })}
              </NavList>
            </Nav>
          ) : (
            <div className="odc-pipeline-run-logs__nav">
              {t('pipelines-plugin~No task runs found')}
            </div>
          )}
        </div>
        <div className="odc-pipeline-run-logs__container">
          {activeItem && resources ? (
            <LogsWrapperComponent
              key={taskName}
              resource={resources}
              taskName={taskName}
              downloadAllLabel={t('pipelines-plugin~Download all task logs')}
              onDownloadAll={downloadAllCallback}
              taskRun={activeTaskRun}
            />
          ) : (
            <div className="odc-pipeline-run-logs__log">
              <div className="odc-pipeline-run-logs__logtext" data-test-id="task-logs-error">
                {waitingForPods && !pipelineRunFinished && `Waiting for ${taskName} task to start `}
                {!resources &&
                  pipelineRunFinished &&
                  !obj.status &&
                  t('pipelines-plugin~No logs found')}
                {logDetails && (
                  <div className="odc-pipeline-run-logs__logsnippet">
                    {logDetails.staticMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

type PipelineRunLogsWithActiveTaskProps = {
  obj: PipelineRunKind;
};

const PipelineRunLogs = withTranslation()(PipelineRunLogsWithTranslation);

export const PipelineRunLogsWithActiveTask: React.FC<PipelineRunLogsWithActiveTaskProps> = ({
  obj,
}) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeTask = params?.get('taskName');
  const [taskRuns, taskRunsLoaded] = useTaskRuns(obj?.metadata?.namespace, obj?.metadata?.name);

  return (
    taskRunsLoaded && <PipelineRunLogs obj={obj} activeTask={activeTask} taskRuns={taskRuns} />
  );
};

export default PipelineRunLogs;

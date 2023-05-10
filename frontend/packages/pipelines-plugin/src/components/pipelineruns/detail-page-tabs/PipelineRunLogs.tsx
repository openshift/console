import * as React from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { withTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { Firehose, resourcePathFromModel } from '@console/internal/components/utils';
import { PipelineRunModel } from '../../../models';
import { PipelineRunKind, TaskRunKind } from '../../../types';
import { pipelineRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { TektonResourceLabel } from '../../pipelines/const';
import { ColoredStatusIcon } from '../../pipelines/detail-page-tabs/pipeline-details/StatusIcon';
import { useTaskRuns } from '../../taskruns/useTaskRuns';
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
    const { activeTask, taskRuns } = this.props;
    const sortedTaskRuns = this.getSortedTaskRun(taskRuns);
    const activeItem = this.getActiveTaskRun(sortedTaskRuns, activeTask);
    this.setState({ activeItem });
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.obj !== nextProps.obj || this.props.taskRuns !== nextProps.taskRuns) {
      const { activeTask, taskRuns } = this.props;
      const sortedTaskRuns = this.getSortedTaskRun(taskRuns);
      const activeItem = this.getActiveTaskRun(sortedTaskRuns, activeTask);
      this.state.navUntouched && this.setState({ activeItem });
    }
  }

  getActiveTaskRun = (taskRuns: string[], activeTask: string): string =>
    activeTask
      ? taskRuns.find((taskRun) => taskRun.includes(activeTask))
      : taskRuns[taskRuns.length - 1];

  getSortedTaskRun = (tRuns: TaskRunKind[]): string[] => {
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
    return taskRuns?.map((tr) => tr?.metadata?.name) || [];
  };

  onNavSelect = (item) => {
    this.setState({
      activeItem: item.itemId,
      navUntouched: false,
    });
  };

  render() {
    const { obj, t, taskRuns: tRuns } = this.props;
    const { activeItem } = this.state;
    const taskRuns = this.getSortedTaskRun(tRuns);
    const taskRunFromYaml = tRuns?.reduce((acc, value) => {
      acc[value?.metadata?.name] = value;
      return acc;
    }, {});
    const logDetails = getPLRLogSnippet(obj, tRuns) as ErrorDetailsWithStaticLog;

    const taskCount = taskRuns.length;
    const downloadAllCallback =
      taskCount > 1
        ? getDownloadAllLogsCallback(
            taskRuns,
            taskRunFromYaml,
            obj.metadata?.namespace,
            obj.metadata?.name,
          )
        : undefined;
    const podName = taskRunFromYaml?.[activeItem]?.status?.podName;
    const taskName =
      taskRunFromYaml?.[activeItem]?.metadata?.labels?.[TektonResourceLabel.pipelineTask] || '-';
    const resources = taskCount > 0 &&
      podName && [
        {
          name: podName,
          kind: 'Pod',
          namespace: obj.metadata.namespace,
          prop: `obj`,
          isList: false,
        },
      ];
    const path = `${resourcePathFromModel(
      PipelineRunModel,
      obj.metadata.name,
      obj.metadata.namespace,
    )}/logs/`;
    return (
      <div className="odc-pipeline-run-logs">
        <div className="odc-pipeline-run-logs__tasklist" data-test-id="logs-tasklist">
          {taskCount > 0 ? (
            <Nav onSelect={this.onNavSelect} theme="light">
              <NavList className="odc-pipeline-run-logs__nav">
                {taskRuns.map((task) => {
                  return (
                    <NavItem
                      key={task}
                      itemId={task}
                      isActive={activeItem === task}
                      className="odc-pipeline-run-logs__navitem"
                    >
                      <Link
                        to={
                          path +
                            taskRunFromYaml?.[task]?.metadata?.labels?.[
                              TektonResourceLabel.pipelineTask
                            ] || '-'
                        }
                      >
                        <ColoredStatusIcon
                          status={pipelineRunFilterReducer(
                            obj?.status?.taskRuns
                              ? _.get(obj, ['status', 'taskRuns', task])
                              : tRuns?.find((tr) => tr?.metadata?.name === task),
                          )}
                        />
                        <span className="odc-pipeline-run-logs__namespan">
                          {taskRunFromYaml[task]?.metadata?.labels?.[
                            TektonResourceLabel.pipelineTask
                          ] || '-'}
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
            <Firehose key={activeItem} resources={resources}>
              <LogsWrapperComponent
                taskName={taskName}
                downloadAllLabel={t('pipelines-plugin~Download all task logs')}
                onDownloadAll={downloadAllCallback}
              />
            </Firehose>
          ) : (
            <div className="odc-pipeline-run-logs__log">
              <div className="odc-pipeline-run-logs__logtext">
                {_.get(
                  obj,
                  ['status', 'conditions', 0, 'message'],
                  t('pipelines-plugin~No logs found'),
                )}
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
  params?: RouteComponentProps;
};

const PipelineRunLogs = withTranslation()(PipelineRunLogsWithTranslation);

export const PipelineRunLogsWithActiveTask: React.FC<PipelineRunLogsWithActiveTaskProps> = ({
  obj,
  params,
}) => {
  const activeTask = _.get(params, 'match.params.name');
  const [taskRuns, taskRunsLoaded] = useTaskRuns(obj?.metadata?.namespace, obj?.metadata?.name);
  return (
    taskRunsLoaded && <PipelineRunLogs obj={obj} activeTask={activeTask} taskRuns={taskRuns} />
  );
};

export default PipelineRunLogs;

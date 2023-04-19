import * as React from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import Helmet from 'react-helmet';
import { useTranslation, withTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { Firehose, resourcePathFromModel } from '@console/internal/components/utils';
import { PipelineRunModel } from '../../../models';
import { PipelineRunKind } from '../../../types';
import { pipelineRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { ColoredStatusIcon } from '../../pipelines/detail-page-tabs/pipeline-details/StatusIcon';
import { ErrorDetailsWithStaticLog } from '../logs/log-snippet-types';
import { getDownloadAllLogsCallback } from '../logs/logs-utils';
import LogsWrapperComponent from '../logs/LogsWrapperComponent';
import { getPLRLogSnippet } from '../logs/pipelineRunLogSnippet';
import './PipelineRunLogs.scss';

interface PipelineRunLogsProps {
  obj: PipelineRunKind;
  activeTask?: string;
  t: TFunction;
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
    const { obj, activeTask } = this.props;
    const taskRunFromYaml = _.get(obj, ['status', 'taskRuns'], {});
    const taskRuns = this.getSortedTaskRun(taskRunFromYaml);
    const activeItem = this.getActiveTaskRun(obj, taskRuns, activeTask);
    this.setState({ activeItem });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.obj !== nextProps.obj) {
      const { obj, activeTask } = this.props;
      const taskRunFromYaml = _.get(obj, ['status', 'taskRuns'], {});
      const taskRuns = this.getSortedTaskRun(taskRunFromYaml);
      const activeItem = this.getActiveTaskRun(obj, taskRuns, activeTask);
      this.state.navUntouched && this.setState({ activeItem });
    }
  }

  getActiveTaskRun = (obj: PipelineRunKind, taskRuns: string[], activeTask: string): string => {
    const activeTaskRun: string = _.findKey(
      obj?.status?.taskRuns,
      (taskRun) => taskRun.pipelineTaskName === activeTask,
    );
    return activeTaskRun || taskRuns[taskRuns.length - 1];
  };

  getSortedTaskRun = (taskRunFromYaml) => {
    const taskRuns = Object.keys(taskRunFromYaml).sort((a, b) => {
      if (_.get(taskRunFromYaml, [a, 'status', 'completionTime'], false)) {
        return taskRunFromYaml[b].status?.completionTime &&
          new Date(taskRunFromYaml[a].status.completionTime) >
            new Date(taskRunFromYaml[b].status.completionTime)
          ? 1
          : -1;
      }
      return taskRunFromYaml[b].status?.completionTime ||
        new Date(taskRunFromYaml[a].status?.startTime) >
          new Date(taskRunFromYaml[b].status?.startTime)
        ? 1
        : -1;
    });
    return taskRuns;
  };

  onNavSelect = (item) => {
    this.setState({
      activeItem: item.itemId,
      navUntouched: false,
    });
  };

  render() {
    const { obj, t } = this.props;
    const { activeItem } = this.state;
    const taskRunFromYaml = _.get(obj, ['status', 'taskRuns'], {});
    const taskRuns = this.getSortedTaskRun(taskRunFromYaml);
    const logDetails = getPLRLogSnippet(obj) as ErrorDetailsWithStaticLog;

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
    const podName = taskRunFromYaml[activeItem]?.status?.podName;
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
                      <Link to={path + _.get(taskRunFromYaml, [task, `pipelineTaskName`], '-')}>
                        <ColoredStatusIcon
                          status={pipelineRunFilterReducer(
                            _.get(obj, ['status', 'taskRuns', task]),
                          )}
                        />
                        <span className="odc-pipeline-run-logs__namespan">
                          {_.get(taskRunFromYaml, [task, `pipelineTaskName`], '-')}
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
                taskName={_.get(taskRunFromYaml, [activeItem, 'pipelineTaskName'], '-')}
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
  const { t } = useTranslation();
  const activeTask = _.get(params, 'match.params.name');
  return (
    <>
      <Helmet>
        <title>{t('pipelines-plugin~PipelineRun logs')}</title>
      </Helmet>
      <PipelineRunLogs obj={obj} activeTask={activeTask} />
    </>
  );
};

export default PipelineRunLogs;

import * as React from 'react';
import * as _ from 'lodash';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { Nav, NavItem, NavList } from '@patternfly/react-core';
import { StatusIcon } from '@console/shared';
import { Firehose, resourcePathFromModel } from '@console/internal/components/utils';
import { pipelineRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { PipelineRun } from '../../../utils/pipeline-augment';
import { PipelineRunModel } from '../../../models';
import PipelineTaskLogs from './PipelineTaskLogs';
import './PipelineRunLogs.scss';

interface PipelineRunLogsProps {
  obj: PipelineRun;
  activeTask?: string;
}
interface PipelineRunLogsState {
  activeItem: string;
  navUntouched: boolean;
}
class PipelineRunLogs extends React.Component<PipelineRunLogsProps, PipelineRunLogsState> {
  constructor(props) {
    super(props);
    this.state = { activeItem: null, navUntouched: true };
  }

  componentDidMount() {
    const { obj, activeTask } = this.props;
    const taskRunFromYaml = _.get(obj, ['status', 'taskRuns'], {});
    const taskRuns = this.getSortedTaskRun(taskRunFromYaml);
    const activeItem = this.getActiveTaskRun(taskRuns, activeTask);
    this.setState({ activeItem });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.obj !== nextProps.obj) {
      const { obj, activeTask } = this.props;
      const taskRunFromYaml = _.get(obj, ['status', 'taskRuns'], {});
      const taskRuns = this.getSortedTaskRun(taskRunFromYaml);
      const activeItem = this.getActiveTaskRun(taskRuns, activeTask);
      this.state.navUntouched && this.setState({ activeItem });
    }
  }

  getActiveTaskRun = (taskRuns: string[], activeTask: string): string =>
    activeTask
      ? taskRuns.find((taskRun) => taskRun.includes(activeTask))
      : taskRuns[taskRuns.length - 1];

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
    const { obj } = this.props;
    const { activeItem } = this.state;
    const taskRunFromYaml = _.get(obj, ['status', 'taskRuns'], {});
    const taskRuns = this.getSortedTaskRun(taskRunFromYaml);

    const taskCount = taskRuns.length;
    const resources = taskCount > 0 && [
      {
        name: _.get(taskRunFromYaml[activeItem], ['status', 'podName'], ''),
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
        <div className="odc-pipeline-run-logs__tasklist">
          {taskCount > 0 ? (
            <Nav onSelect={this.onNavSelect}>
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
                        <StatusIcon
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
            <div className="odc-pipeline-run-logs__nav">No Task Runs Found</div>
          )}
        </div>
        <div className="odc-pipeline-run-logs__container">
          {activeItem ? (
            <Firehose resources={resources}>
              <PipelineTaskLogs
                taskName={_.get(taskRunFromYaml, [activeItem, 'pipelineTaskName'], '-')}
              />
            </Firehose>
          ) : _.has(obj, ['status', 'conditions', 0, 'message']) ? (
            <div className="odc-pipeline-run-logs__log">
              {_.get(obj, ['status', 'conditions', 0, 'message'], '-')}
            </div>
          ) : (
            <div>No Logs Found</div>
          )}
        </div>
      </div>
    );
  }
}

type PipelineRunLogsWithActiveTaskProps = {
  obj: PipelineRun;
  params?: RouteComponentProps;
};

export const PipelineRunLogsWithActiveTask: React.FC<PipelineRunLogsWithActiveTaskProps> = ({
  obj,
  params,
}) => {
  const activeTask = _.get(params, 'match.params.name');
  return <PipelineRunLogs obj={obj} activeTask={activeTask} />;
};

export default PipelineRunLogs;

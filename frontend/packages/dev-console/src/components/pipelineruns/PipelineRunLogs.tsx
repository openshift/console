import * as React from 'react';
import * as _ from 'lodash';
import { Nav, NavItem, NavList } from '@patternfly/react-core';
import { PodLogs } from '@console/internal/components/pod-logs';
import { StatusIcon } from '@console/shared';
import { Firehose } from '@console/internal/components/utils';
import { pipelineRunFilterReducer } from '../../utils/pipeline-filter-reducer';
import { truncateName, PipelineRun } from '../../utils/pipeline-augment';
import './PipelineRunLogs.scss';

interface PipelineRunLogsProps {
  obj: PipelineRun;
}
interface PipelineRunLogsState {
  activeItem: string;
}
class PipelineRunLogs extends React.Component<PipelineRunLogsProps, PipelineRunLogsState> {
  constructor(props) {
    super(props);
    this.state = { activeItem: null };
  }

  componentDidMount() {
    const { obj } = this.props;
    const taskRunFromYaml = _.get(obj, ['status', 'taskRuns'], {});
    const taskRuns = this.getSortedTaskRun(taskRunFromYaml);
    this.setState({ activeItem: taskRuns[taskRuns.length - 1] });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.obj !== nextProps.obj) {
      const { obj } = this.props;
      const taskRunFromYaml = _.get(obj, ['status', 'taskRuns'], {});
      const taskRuns = this.getSortedTaskRun(taskRunFromYaml);
      this.setState({ activeItem: taskRuns[taskRuns.length - 1] });
    }
  }

  getSortedTaskRun = (taskRunFromYaml) => {
    const taskRuns = Object.keys(taskRunFromYaml).sort((a, b) => {
      if (taskRunFromYaml[a].status.completionTime) {
        return taskRunFromYaml[b].status.completionTime &&
          new Date(taskRunFromYaml[a].status.completionTime) >
            new Date(taskRunFromYaml[b].status.completionTime)
          ? 1
          : -1;
      }
      return taskRunFromYaml[b].status.completionTime ||
        new Date(taskRunFromYaml[a].status.startTime) >
          new Date(taskRunFromYaml[b].status.startTime)
        ? 1
        : -1;
    });
    return taskRuns;
  };

  onNavSelect = (item) => {
    this.setState({
      activeItem: item.itemId,
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
    return (
      <div className="odc-pipeline-run-logs">
        <div className="col-xs-3 odc-pipeline-run-logs__task__list">
          {taskCount > 0 ? (
            <Nav onSelect={this.onNavSelect}>
              <NavList className="odc-pipeline-run-logs__nav">
                {taskRuns.map((task) => {
                  return (
                    <NavItem
                      key={task}
                      itemId={task}
                      isActive={activeItem === task}
                      className="odc-pipeline-run-logs__nav__item"
                    >
                      <StatusIcon status={pipelineRunFilterReducer(obj.status.taskRuns[task])} />
                      <span className="odc-pipeline-run-logs__name__span">
                        {truncateName(taskRunFromYaml[task].pipelineTaskName, 20)}
                      </span>
                    </NavItem>
                  );
                })}
              </NavList>
            </Nav>
          ) : (
            <div className="odc-pipeline-run-logs__nav">No Task Runs Found</div>
          )}
        </div>
        <div className="col-xs-9 odc-pipeline-run-logs__container">
          {activeItem ? (
            <Firehose resources={resources}>
              <FetchTRPod />
            </Firehose>
          ) : _.has(obj, ['status', 'conditions', '0', 'message']) ? (
            <div className="odc-pipeline-run-logs__log">{obj.status.conditions[0].message}</div>
          ) : (
            <div>No Logs Found</div>
          )}
        </div>
      </div>
    );
  }
}

export default PipelineRunLogs;

export const FetchTRPod = (props) =>
  props.obj && props.obj.data ? <PodLogs obj={props.obj.data} /> : <div>No logs Found</div>;

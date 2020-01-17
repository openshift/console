import * as React from 'react';
import * as _ from 'lodash';
import classNames from 'classnames';
import { Button } from '@patternfly/react-core';
import { saveAs } from 'file-saver';
import { DownloadIcon } from '@patternfly/react-icons';
import { K8sKind } from '@console/internal/module/k8s';
import {
  ResourceLog,
  LOG_SOURCE_TERMINATED,
  LoadingInline,
} from '@console/internal/components/utils';
import { ContainerStatus, containerToLogSourceStatus } from '../../../utils/pipeline-utils';
import './PipelineTaskLogs.scss';

interface Pod {
  data: K8sKind;
}

interface Container extends K8sKind {
  name?: string;
}

interface PipelineTaskLogsProps {
  obj?: Pod;
  taskName: string;
}

interface PipelineTaskLogsState {
  renderContainers: Container[];
  fetching: boolean;
  targetHeight: number;
}

const getRenderContainers = (pod: Pod): { containers: Container[]; stillFetching: boolean } => {
  const containers: Container[] = _.get(pod, ['spec', 'containers'], []);
  const containerStatus: ContainerStatus[] = _.get(pod, ['status', 'containerStatuses'], []);

  const containerNames = containers.map((c) => c.name);
  const sortedContainerStatus = [];
  containerStatus.forEach((cs) => {
    const containerIndex = containerNames.indexOf(cs.name);
    sortedContainerStatus[containerIndex] = cs;
  });

  const firstrunningCont = sortedContainerStatus.findIndex(
    (container) => containerToLogSourceStatus(container) !== LOG_SOURCE_TERMINATED,
  );
  return {
    containers: containers.slice(
      0,
      firstrunningCont === -1 ? containers.length : firstrunningCont + 1,
    ),
    stillFetching: firstrunningCont !== -1,
  };
};

class PipelineTaskLogs extends React.Component<PipelineTaskLogsProps, PipelineTaskLogsState> {
  scrollPane: React.RefObject<HTMLDivElement> = React.createRef();

  scrollUntouched: boolean = true;

  isAutoScrolling: boolean = false;

  constructor(props) {
    super(props);
    this.state = {
      renderContainers: [],
      fetching: false,
      targetHeight: null,
    };
  }

  componentDidMount() {
    const pod: Pod = _.get(this.props, ['obj', 'data'], {});
    const { containers, stillFetching } = getRenderContainers(pod);
    this.setState({
      renderContainers: containers,
      fetching: stillFetching,
    });

    this.scrollToBottom();
    window.addEventListener('resize', this.sizeContainer, { passive: true });
    this.sizeContainer();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps)) {
      const pod: Pod = _.get(nextProps, ['obj', 'data'], {});
      const { containers, stillFetching } = getRenderContainers(pod);
      this.setState({
        renderContainers: containers,
        fetching: stillFetching,
      });
    }
    if (
      _.get(this.props, ['obj', 'data', 'metadata', 'name'], false) !==
      _.get(nextProps, ['obj', 'data', 'metadata', 'name'], false)
    ) {
      this.scrollUntouched = true;
    }
  }

  componentDidUpdate() {
    setTimeout(() => this.scrollToBottom(), 800); // buffer time for children to render
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.sizeContainer);
  }

  sizeContainer = (): void => {
    if (!this.scrollPane.current) {
      return;
    }
    const targetHeight = Math.floor(
      window.innerHeight - this.scrollPane.current.getBoundingClientRect().top - 50,
    );
    this.setState({ targetHeight });
  };

  scrollToBottom = (): void => {
    if (this.scrollUntouched && this.scrollPane.current) {
      this.isAutoScrolling = true;
      if (typeof this.scrollPane.current.scroll === 'function') {
        this.scrollPane.current.scroll({
          top: _.get(this.scrollPane, ['current', 'scrollHeight'], false),
          behavior: 'smooth',
        });
        setTimeout(() => (this.isAutoScrolling = false), 200); // buffer time for scroll to complete
      }
    }
  };

  downloadLogs = () => {
    let logString = _.get(this.scrollPane, ['current', 'innerText'], '');
    // Removing 'Taskname' from file content and using it in 'filename' to keep it similar with resource-log
    logString = logString.substring(logString.indexOf('\n') + 1);
    const blob = new Blob([logString], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, `${this.props.taskName}.log`);
  };

  render() {
    const { obj, taskName } = this.props;
    const { renderContainers, fetching, targetHeight } = this.state;
    const containerStatus = _.get(this.props, ['obj', 'data', 'status', 'containerStatuses'], []);
    return (
      <>
        <div className="co-toolbar odc-pipeline-task-logs__toolbar">
          <div className="co-toolbar__group co-toolbar__group--left" />
          <div className="co-toolbar__group co-toolbar__group--right">
            <Button variant="link" onClick={this.downloadLogs}>
              <DownloadIcon className="co-icon-space-r" />
              Download
            </Button>
          </div>
        </div>
        <div
          className={classNames('odc-pipeline-task-logs__container', {
            'is-edge': window.navigator.userAgent.includes('Edge'),
          })}
          onScroll={() =>
            this.scrollUntouched && !this.isAutoScrolling && (this.scrollUntouched = false)
          }
          style={{ height: targetHeight }}
          ref={this.scrollPane}
        >
          <div className="odc-pipeline-task-logs__taskName">
            {taskName}
            {fetching && (
              <span className="odc-pipeline-task-logs__taskName--loading">
                <LoadingInline />
              </span>
            )}
          </div>
          {renderContainers.length > 0 ? (
            renderContainers.map((container, i) => (
              <div className="odc-pipeline-task-logs__step" key={container.name}>
                <p className="odc-pipeline-task-logs__stepname">{container.name}</p>
                <ResourceLog
                  resource={obj.data}
                  containerName={container.name}
                  resourceStatus={containerToLogSourceStatus(containerStatus[i])}
                />
              </div>
            ))
          ) : (
            <div className="odc-pipeline-task-logs__nosteps">No steps found</div>
          )}
        </div>
      </>
    );
  }
}

export default PipelineTaskLogs;

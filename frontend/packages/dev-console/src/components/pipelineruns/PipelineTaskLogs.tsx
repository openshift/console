import * as React from 'react';
import * as _ from 'lodash';
import { K8sKind } from '@console/internal/module/k8s';
import {
  ResourceLog,
  LOG_SOURCE_TERMINATED,
  LoadingInline,
} from '@console/internal/components/utils';
import { ContainerStatus, containerToLogSourceStatus } from '../../utils/pipeline-utils';
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
    const containers: Container[] = _.get(this.props, ['obj', 'data', 'spec', 'containers'], []);
    const containerStatus: ContainerStatus[] = _.get(
      this.props,
      ['obj', 'data', 'status', 'containerStatuses'],
      [],
    );
    const firstrunningCont = containerStatus.findIndex(
      (container) => containerToLogSourceStatus(container) !== LOG_SOURCE_TERMINATED,
    );
    const renderContainers = containers.slice(
      0,
      firstrunningCont === -1 ? containers.length : firstrunningCont + 1,
    );

    this.setState({ renderContainers });
    firstrunningCont === -1
      ? this.setState({ fetching: false })
      : this.setState({ fetching: true });
    this.scrollToBottom();
    window.addEventListener('resize', this.sizeContainer, { passive: true });
    this.sizeContainer();
  }

  componentWillReceiveProps(nextProps) {
    const containers: Container[] = _.get(nextProps, ['obj', 'data', 'spec', 'containers'], []);
    const containerStatus: ContainerStatus[] = _.get(
      nextProps,
      ['obj', 'data', 'status', 'containerStatuses'],
      [],
    );
    if (this.props !== nextProps) {
      const firstrunningCont = containerStatus.findIndex(
        (container) => containerToLogSourceStatus(container) !== LOG_SOURCE_TERMINATED,
      );
      const renderContainers = containers.slice(
        0,
        firstrunningCont === -1 ? containers.length : firstrunningCont + 1,
      );
      this.setState({ renderContainers });
      firstrunningCont === -1
        ? this.setState({ fetching: false })
        : this.setState({ fetching: true });
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
      this.scrollPane.current.scroll({
        top: _.get(this.scrollPane, ['current', 'scrollHeight'], false),
        behavior: 'smooth',
      });
      setTimeout(() => (this.isAutoScrolling = false), 200); // buffer time for scroll to complete
    }
  };

  render() {
    const { obj, taskName } = this.props;
    const { renderContainers, fetching, targetHeight } = this.state;
    const containerStatus = _.get(this.props, ['obj', 'data', 'status', 'containerStatuses'], []);
    return (
      <div
        className="odc-pipeline-task-logs__container"
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
    );
  }
}

export default PipelineTaskLogs;

import * as React from 'react';
import * as classNames from 'classnames';
import { saveAs } from 'file-saver';
import { ContainerStatus, PodKind, ContainerSpec } from '@console/internal/module/k8s';
import { LogControls, LoadingInline } from '@console/internal/components/utils';
import { useFullscreen, useScrollDirection, ScrollDirection } from '@console/shared';
import { containerToLogSourceStatus } from '../../../utils/pipeline-utils';
import { getRenderContainers } from './logs-utils';
import Logs from './Logs';
import './MultiStreamLogs.scss';

type MultiStreamLogsProps = {
  resource: PodKind;
  taskName: string;
};

export const MultiStreamLogs: React.FC<MultiStreamLogsProps> = ({ resource, taskName }) => {
  const scrollPane = React.useRef<HTMLDivElement>();
  const completedRef = React.useRef<boolean[]>([]);
  const [renderToCount, setRenderToCount] = React.useState(0);
  const [isFullscreen, fullscreenRef, fullscreenToggle] = useFullscreen<HTMLDivElement>();
  const [scrollDirection, handleScrollCallback] = useScrollDirection();
  const [autoScroll, setAutoScroll] = React.useState(true);
  const { containers, stillFetching } = getRenderContainers(resource);
  const dataRef = React.useRef<ContainerSpec[]>(null);
  dataRef.current = containers;

  const handleComplete = React.useCallback((containerName) => {
    const index = dataRef.current.findIndex(({ name }) => name === containerName);
    completedRef.current[index] = true;
    const newRenderTo = dataRef.current.findIndex((c, i) => completedRef.current[i] !== true);
    if (newRenderTo === -1) {
      setRenderToCount(dataRef.current.length);
    } else {
      setRenderToCount(newRenderTo);
    }
  }, []);

  React.useEffect(() => {
    if (!scrollDirection) return;
    if (scrollDirection === ScrollDirection.scrollingUp && autoScroll === true) {
      setAutoScroll(false);
    }
    if (scrollDirection === ScrollDirection.scrolledToBottom && autoScroll === false) {
      setAutoScroll(true);
    }
  }, [autoScroll, scrollDirection]);
  const downloadLogs = () => {
    if (!scrollPane.current) return;
    const logString = scrollPane.current.innerText;
    const blob = new Blob([logString], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, `${taskName}.log`);
  };

  const containerStatus: ContainerStatus[] = resource.status?.containerStatuses ?? [];
  return (
    <div
      ref={fullscreenRef}
      className={classNames('odc-multi-stream-logs', {
        'odc-multi-stream-logs--fullscreen': isFullscreen,
      })}
    >
      <LogControls
        isFullscreen={isFullscreen}
        onDownload={downloadLogs}
        toggleFullscreen={fullscreenToggle}
      />
      <div className="odc-multi-stream-logs__taskName">
        {taskName}
        {stillFetching && (
          <span className="odc-multi-stream-logs__taskName__loading-indicator">
            <LoadingInline />
          </span>
        )}
      </div>
      <div className="odc-multi-stream-logs__container" data-test-id="logs-task-container">
        <div
          className="odc-multi-stream-logs__container__logs"
          ref={scrollPane}
          onScroll={handleScrollCallback}
        >
          {containers.map((container, idx) => {
            return (
              <Logs
                key={container.name}
                resource={resource}
                container={container}
                resourceStatus={containerToLogSourceStatus(containerStatus[idx])}
                onComplete={handleComplete}
                render={renderToCount >= idx}
                autoScroll={autoScroll}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

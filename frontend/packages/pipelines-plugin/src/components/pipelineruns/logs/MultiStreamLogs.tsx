import * as React from 'react';
import { LoadingInline, LOG_SOURCE_WAITING } from '@console/internal/components/utils';
import { ContainerStatus, PodKind, ContainerSpec } from '@console/internal/module/k8s';
import { useScrollDirection, ScrollDirection } from '@console/shared';
import { containerToLogSourceStatus } from '../../../utils/pipeline-utils';
import Logs from './Logs';
import { getRenderContainers } from './logs-utils';

import './MultiStreamLogs.scss';

type MultiStreamLogsProps = {
  resource: PodKind;
  taskName?: string;
  setCurrentLogsGetter?: (getter: () => string) => void;
};

export const MultiStreamLogs: React.FC<MultiStreamLogsProps> = ({
  resource,
  taskName,
  setCurrentLogsGetter,
}) => {
  const scrollPane = React.useRef<HTMLDivElement>();
  const completedRef = React.useRef<boolean[]>([]);
  const [renderToCount, setRenderToCount] = React.useState(0);
  const [scrollDirection, handleScrollCallback] = useScrollDirection();
  const { containers, stillFetching } = getRenderContainers(resource);
  const dataRef = React.useRef<ContainerSpec[]>(null);
  dataRef.current = containers;

  React.useEffect(() => {
    setCurrentLogsGetter(() => {
      return scrollPane.current?.innerText;
    });
  }, [setCurrentLogsGetter]);

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

  const autoScroll =
    scrollDirection == null || scrollDirection !== ScrollDirection.scrolledToBottom;

  const containerStatus: ContainerStatus[] = resource?.status?.containerStatuses ?? [];
  return (
    <>
      <div className="odc-multi-stream-logs__taskName" data-test-id="logs-taskName">
        {taskName}
        {stillFetching && (
          <span className="odc-multi-stream-logs__taskName__loading-indicator">
            <LoadingInline />
          </span>
        )}
      </div>
      <div
        className="odc-multi-stream-logs__container"
        onScroll={handleScrollCallback}
        data-test-id="logs-task-container"
      >
        <div className="odc-multi-stream-logs__container__logs" ref={scrollPane}>
          {containers.map((container, idx) => {
            const statusIndex = containerStatus.findIndex((c) => c.name === container.name);
            const resourceStatus = containerToLogSourceStatus(containerStatus[statusIndex]);
            return (
              resourceStatus !== LOG_SOURCE_WAITING && (
                <Logs
                  key={`${taskName}-${container.name}`}
                  resource={resource}
                  container={container}
                  resourceStatus={resourceStatus}
                  onComplete={handleComplete}
                  render={renderToCount >= idx}
                  autoScroll={autoScroll}
                />
              )
            );
          })}
        </div>
      </div>
    </>
  );
};

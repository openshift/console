import * as React from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { DownloadIcon, CompressIcon, ExpandIcon } from '@patternfly/react-icons';
import * as classNames from 'classnames';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';
import { errorModal } from '@console/internal/components/modals/error-modal';
import { LoadingInline, LOG_SOURCE_WAITING } from '@console/internal/components/utils';
import { ContainerStatus, PodKind, ContainerSpec } from '@console/internal/module/k8s';
import { useFullscreen, useScrollDirection, ScrollDirection } from '@console/shared';
import { containerToLogSourceStatus } from '../../../utils/pipeline-utils';
import Logs from './Logs';
import { getRenderContainers } from './logs-utils';
import './MultiStreamLogs.scss';

type MultiStreamLogsProps = {
  resource: PodKind;
  taskName: string;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
};

export const MultiStreamLogs: React.FC<MultiStreamLogsProps> = ({
  resource,
  taskName,
  downloadAllLabel,
  onDownloadAll,
}) => {
  const { t } = useTranslation();
  const scrollPane = React.useRef<HTMLDivElement>();
  const completedRef = React.useRef<boolean[]>([]);
  const [renderToCount, setRenderToCount] = React.useState(0);
  const [isFullscreen, fullscreenRef, fullscreenToggle] = useFullscreen<HTMLDivElement>();
  const [scrollDirection, handleScrollCallback] = useScrollDirection();
  const [autoScroll, setAutoScroll] = React.useState(true);
  const { containers, stillFetching } = getRenderContainers(resource);
  const [downloadAllStatus, setDownloadAllStatus] = React.useState(false);
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
  const startDownloadAll = () => {
    setDownloadAllStatus(true);
    onDownloadAll()
      .then(() => {
        setDownloadAllStatus(false);
      })
      .catch((err: Error) => {
        setDownloadAllStatus(false);
        const error = err.message || t('pipelines-plugin~Error downloading logs.');
        errorModal({ error });
      });
  };
  const downloadLogs = () => {
    if (!scrollPane.current) return;
    const logString = scrollPane.current.innerText;
    const blob = new Blob([logString], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, `${taskName}.log`);
  };

  const containerStatus: ContainerStatus[] = resource.status?.containerStatuses ?? [];
  const divider = <FlexItem className="odc-multi-stream-logs__divider">|</FlexItem>;
  return (
    <div ref={fullscreenRef} className="odc-multi-stream-logs">
      <Flex
        className={classNames({
          'odc-multi-stream-logs--fullscreen': isFullscreen,
        })}
      >
        <FlexItem className="odc-multi-stream-logs__button" align={{ default: 'alignRight' }}>
          <Button variant="link" onClick={downloadLogs} isInline>
            <DownloadIcon className="odc-multi-stream-logs__icon" />
            {t('pipelines-plugin~Download')}
          </Button>
        </FlexItem>
        {divider}
        {onDownloadAll && (
          <>
            <FlexItem className="odc-multi-stream-logs__button">
              <Button
                variant="link"
                onClick={startDownloadAll}
                isDisabled={downloadAllStatus}
                isInline
              >
                <DownloadIcon className="odc-multi-stream-logs__icon" />
                {downloadAllLabel || t('pipelines-plugin~Download all')}
                {downloadAllStatus && <LoadingInline />}
              </Button>
            </FlexItem>
            {divider}
          </>
        )}
        {fullscreenToggle && (
          <FlexItem className="odc-multi-stream-logs__button">
            <Button variant="link" onClick={fullscreenToggle} isInline>
              {isFullscreen ? (
                <>
                  <CompressIcon className="odc-multi-stream-logs__icon" />
                  {t('pipelines-plugin~Collapse')}
                </>
              ) : (
                <>
                  <ExpandIcon className="odc-multi-stream-logs__icon" />
                  {t('pipelines-plugin~Expand')}
                </>
              )}
            </Button>
          </FlexItem>
        )}
      </Flex>
      <div className="odc-multi-stream-logs__taskName">
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
                  key={container.name}
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
    </div>
  );
};

import type { FC } from 'react';
import { useRef, useState, useCallback } from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { CompressIcon, DownloadIcon, ExpandIcon } from '@patternfly/react-icons';
import { css } from '@patternfly/react-styles';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';
import { LoadingInline } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { PodKind, WatchK8sResource } from '@console/internal/module/k8s';
import { useFullscreen } from '@console/shared/src/hooks/useFullscreen';
import type { TaskRunKind } from '../../types';
import { MultiStreamLogs } from './MultiStreamLogs';
import { TektonTaskRunLog } from './TektonTaskRunLog';

type LogsWrapperComponentProps = {
  taskName?: string;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
  taskRun?: TaskRunKind;
  resource?: WatchK8sResource;
};

const LogsWrapperComponent: FC<LogsWrapperComponentProps> = ({
  resource,
  taskRun,
  taskName,
  onDownloadAll,
  downloadAllLabel = 'Download all',
  ...props
}) => {
  const { t } = useTranslation();
  const resourceRef = useRef(null);
  const [obj, loaded, error] = useK8sWatchResource<PodKind>(resource);
  const [fullscreenRef, fullscreenToggle, isFullscreen] = useFullscreen();
  const [downloadAllStatus, setDownloadAllStatus] = useState(false);
  const currentLogGetterRef = useRef<() => string>();

  if (loaded && !error && resource.name === obj.metadata.name) {
    resourceRef.current = obj;
  } else if (error) {
    resourceRef.current = null;
  }

  const downloadLogs = () => {
    if (!currentLogGetterRef.current) {
      return;
    }
    const logString = currentLogGetterRef.current();
    const blob = new Blob([logString], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, `${taskName}.log`);
  };
  const setLogGetter = useCallback((getter) => (currentLogGetterRef.current = getter), []);

  const startDownloadAll = () => {
    setDownloadAllStatus(true);
    onDownloadAll()
      .then(() => {
        setDownloadAllStatus(false);
      })
      .catch((err: Error) => {
        setDownloadAllStatus(false);
        // eslint-disable-next-line no-console
        console.warn(err.message || 'Error downloading logs.');
      });
  };

  return (
    <div ref={fullscreenRef} className="odc-multi-stream-logs">
      <Flex
        className={css({
          'odc-multi-stream-logs--fullscreen': isFullscreen,
        })}
      >
        <FlexItem className="odc-multi-stream-logs__button" align={{ default: 'alignRight' }}>
          <Button variant="link" onClick={downloadLogs} isInline>
            <DownloadIcon className="odc-multi-stream-logs__icon" />
            {t('shipwright-plugin~Download')}
          </Button>
        </FlexItem>
        <FlexItem className="odc-multi-stream-logs__divider">|</FlexItem>
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
                {downloadAllLabel || t('shipwright-plugin~Download all')}
                {downloadAllStatus && <LoadingInline />}
              </Button>
            </FlexItem>
            <FlexItem className="odc-multi-stream-logs__divider">|</FlexItem>
          </>
        )}
        {fullscreenToggle && (
          <FlexItem className="odc-multi-stream-logs__button">
            <Button variant="link" onClick={fullscreenToggle} isInline>
              {isFullscreen ? (
                <>
                  <CompressIcon className="odc-multi-stream-logs__icon" />
                  {t('shipwright-plugin~Collapse')}
                </>
              ) : (
                <>
                  <ExpandIcon className="odc-multi-stream-logs__icon" />
                  {t('shipwright-plugin~Expand')}
                </>
              )}
            </Button>
          </FlexItem>
        )}
      </Flex>
      {!error ? (
        <MultiStreamLogs
          {...props}
          taskName={taskName}
          resource={resourceRef.current}
          setCurrentLogsGetter={setLogGetter}
        />
      ) : (
        <TektonTaskRunLog taskRun={taskRun} setCurrentLogsGetter={setLogGetter} />
      )}
    </div>
  );
};

export default LogsWrapperComponent;

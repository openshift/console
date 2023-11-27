import * as React from 'react';
import { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { LoadingInline } from '@console/internal/components/utils';
import { TaskRunKind } from '../../../types';
import { TektonResourceLabel } from '../../pipelines/const';
import { useTRTaskRunLog } from '../hooks/useTektonResults';

import './Logs.scss';
import './MultiStreamLogs.scss';

type TektonTaskRunLogProps = {
  taskRun?: TaskRunKind;
  setCurrentLogsGetter: (getter: () => string) => void;
};

export const TektonTaskRunLog: React.FC<TektonTaskRunLogProps> = ({
  taskRun,
  setCurrentLogsGetter,
}) => {
  const scrollPane = React.useRef<HTMLDivElement>();
  const taskName = taskRun?.metadata?.labels?.[TektonResourceLabel.pipelineTask] || '-';
  const [trResults, trLoaded, trError] = useTRTaskRunLog(
    taskRun.metadata.namespace,
    taskRun.metadata.name,
  );

  React.useEffect(() => {
    setCurrentLogsGetter(() => scrollPane.current?.innerText);
  }, [setCurrentLogsGetter]);

  React.useEffect(() => {
    if (!trError && trLoaded && scrollPane.current && trResults) {
      scrollPane.current.scrollTop = scrollPane.current.scrollHeight;
    }
  }, [trError, trLoaded, trResults]);

  const errorMessage =
    (trError as HttpError)?.code === 404
      ? `Logs are no longer accessible for ${taskName} task`
      : null;
  return (
    <>
      <div className="odc-multi-stream-logs__taskName" data-test-id="logs-taskName">
        {taskName}
        {!trLoaded && (
          <span
            className="odc-multi-stream-logs__taskName__loading-indicator"
            data-test-id="loading-indicator"
          >
            <LoadingInline />
          </span>
        )}
      </div>
      <div
        className="odc-multi-stream-logs__container"
        data-test-id="tr-logs-task-container"
        ref={scrollPane}
      >
        <div className="odc-multi-stream-logs__container__logs" data-testid="tr-logs-container">
          {errorMessage && (
            <div className="odc-pipeline-run-logs__logtext" data-testid="tr-logs-error-message">
              {errorMessage}
            </div>
          )}
          {!errorMessage && trLoaded ? (
            <div className="odc-logs" data-testid="tr-logs-container">
              <p className="odc-logs__name">{taskName}</p>
              <div>
                <div className="odc-logs__content" data-testid="tr-logs-content">
                  {trResults}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

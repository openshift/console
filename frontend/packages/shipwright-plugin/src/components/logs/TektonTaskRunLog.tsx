import type { FC } from 'react';
import { useRef, useEffect } from 'react';
import type { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { LoadingInline } from '@console/internal/components/utils';
import type { TaskRunKind } from '../../types';
import { useTRTaskRunLog } from './useTektonResults';

import './Logs.scss';
import './MultiStreamLogs.scss';

export enum TektonResourceLabel {
  pipeline = 'tekton.dev/pipeline',
  pipelinerun = 'tekton.dev/pipelineRun',
  pipelineRunUid = 'tekton.dev/pipelineRunUID',
  taskrun = 'tekton.dev/taskRun',
  pipelineTask = 'tekton.dev/pipelineTask',
}

type TektonTaskRunLogProps = {
  taskRun?: TaskRunKind;
  setCurrentLogsGetter: (getter: () => string) => void;
};

export const TektonTaskRunLog: FC<TektonTaskRunLogProps> = ({ taskRun, setCurrentLogsGetter }) => {
  const scrollPane = useRef<HTMLDivElement>();
  const taskName = taskRun?.metadata?.labels?.[TektonResourceLabel.pipelineTask] || '-';
  const [trResults, trLoaded, trError] = useTRTaskRunLog(
    taskRun.metadata.namespace,
    taskRun.metadata.name,
    taskRun.metadata?.annotations?.['results.tekton.dev/record'],
  );

  useEffect(() => {
    setCurrentLogsGetter(() => scrollPane.current?.innerText);
  }, [setCurrentLogsGetter]);

  useEffect(() => {
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
        <div className="odc-multi-stream-logs__container__logs" data-test="tr-logs-container">
          {errorMessage && (
            <div className="odc-pipeline-run-logs__logtext" data-test="tr-logs-error-message">
              {errorMessage}
            </div>
          )}
          {!errorMessage && trLoaded ? (
            <div className="odc-logs" data-test="tr-logs-container">
              <p className="odc-logs__name">{taskName}</p>
              <div>
                <div className="odc-logs__content" data-test="tr-logs-content">
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

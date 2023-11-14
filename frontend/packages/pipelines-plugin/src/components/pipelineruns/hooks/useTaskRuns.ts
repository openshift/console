import * as React from 'react';
import { TaskRunKind } from '../../../types';
import { TektonResourceLabel } from '../../pipelines/const';
import { useTaskRuns as useTaskRuns2 } from './usePipelineRuns';

export const useTaskRuns = (
  namespace: string,
  pipelineRunName: string,
  taskName?: string,
): [TaskRunKind[], boolean, unknown] => {
  const [taskRuns, loaded, error] = useTaskRuns2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [TektonResourceLabel.pipelinerun]: pipelineRunName,
            ...(taskName ? { [TektonResourceLabel.pipelineTask]: taskName } : {}),
          },
        },
      }),
      [pipelineRunName, taskName],
    ),
  );

  const sortedTaskRuns = React.useMemo(
    () =>
      taskRuns?.sort((a, b) => {
        if (a?.status?.completionTime) {
          return b?.status?.completionTime &&
            new Date(a?.status?.completionTime) > new Date(b?.status?.completionTime)
            ? 1
            : -1;
        }
        return b?.status?.startTime ||
          new Date(a?.status?.startTime) > new Date(b?.status?.startTime)
          ? 1
          : -1;
      }),
    [taskRuns],
  );
  return React.useMemo(() => [sortedTaskRuns, loaded, error], [sortedTaskRuns, loaded, error]);
};

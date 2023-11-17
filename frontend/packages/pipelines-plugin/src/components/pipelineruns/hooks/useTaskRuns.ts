import * as React from 'react';
import { Selector } from '@console/dynamic-plugin-sdk/src';
import { TaskRunKind } from '../../../types';
import { TektonResourceLabel } from '../../pipelines/const';
import { useTaskRuns as useTaskRuns2 } from './usePipelineRuns';
import { GetNextPage } from './useTektonResults';

export const useTaskRuns = (
  namespace: string,
  pipelineRunName?: string,
  taskName?: string,
): [TaskRunKind[], boolean, unknown, GetNextPage] => {
  const selector: Selector = React.useMemo(() => {
    if (pipelineRunName) {
      return { matchLabels: { [TektonResourceLabel.pipelinerun]: pipelineRunName } };
    }
    if (taskName) {
      return { matchLabels: { [TektonResourceLabel.pipelineTask]: taskName } };
    }
    return undefined;
  }, [taskName, pipelineRunName]);
  const [taskRuns, loaded, error, getNextPage] = useTaskRuns2(
    namespace,
    selector && {
      selector,
    },
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
  return React.useMemo(() => [sortedTaskRuns, loaded, error, getNextPage], [
    sortedTaskRuns,
    loaded,
    error,
    getNextPage,
  ]);
};

import { RepositoryKind } from './types';

export const getLatestRepositoryPLRName = (repository: RepositoryKind) => {
  const runNames = repository.pipelinerun_status
    ?.sort((a, b) => {
      if (a.completionTime) {
        return b?.completionTime && new Date(a.completionTime) > new Date(b.completionTime)
          ? 1
          : -1;
      }
      return b?.completionTime || new Date(a?.startTime) > new Date(b.startTime) ? 1 : -1;
    })
    .map((plrStatus) => plrStatus.pipelineRunName);
  return runNames?.length > 0 ? runNames[runNames.length - 1] : '';
};

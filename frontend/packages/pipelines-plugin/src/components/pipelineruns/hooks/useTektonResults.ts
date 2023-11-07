import * as React from 'react';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src';
import { PipelineRunKind, TaskRunKind } from '../../../types';
import {
  getPipelineRuns,
  TektonResultsOptions,
  getTaskRuns,
  RecordsList,
  getTaskRunLog,
} from '../utils/tekton-results';

export type GetNextPage = () => void | undefined;

const useTRRuns = <Kind extends K8sResourceCommon>(
  getRuns: (
    namespace: string,
    options?: TektonResultsOptions,
    nextPageToken?: string,
    cacheKey?: string,
  ) => Promise<[Kind[], RecordsList, boolean?]>,
  namespace: string,
  options?: TektonResultsOptions,
  cacheKey?: string,
): [Kind[], boolean, unknown, GetNextPage] => {
  const [nextPageToken, setNextPageToken] = React.useState<string>(null);
  const [localCacheKey, setLocalCacheKey] = React.useState(cacheKey);

  if (cacheKey !== localCacheKey) {
    // force update local cache key
    setLocalCacheKey(cacheKey);
  }

  const [result, setResult] = React.useState<[Kind[], boolean, unknown, GetNextPage]>([
    [],
    false,
    undefined,
    undefined,
  ]);

  // reset token if namespace or options change
  React.useEffect(() => {
    setNextPageToken(null);
  }, [namespace, options, cacheKey]);

  // eslint-disable-next-line consistent-return
  React.useEffect(() => {
    let disposed = false;
    if (namespace) {
      (async () => {
        try {
          const tkPipelineRuns = await getRuns(namespace, options, nextPageToken, localCacheKey);
          if (!disposed) {
            const token = tkPipelineRuns[1].nextPageToken;
            const callInflight = !!tkPipelineRuns?.[2];
            const loaded = !callInflight;
            if (!callInflight) {
              setResult((cur) => [
                nextPageToken ? [...cur[0], ...tkPipelineRuns[0]] : tkPipelineRuns[0],
                loaded,
                undefined,
                token
                  ? (() => {
                      // ensure we can only call this once
                      let executed = false;
                      return () => {
                        if (!disposed && !executed) {
                          executed = true;
                          // trigger the update
                          setNextPageToken(token);
                          return true;
                        }
                        return false;
                      };
                    })()
                  : undefined,
              ]);
            }
          }
        } catch (e) {
          if (!disposed) {
            if (nextPageToken) {
              setResult((cur) => [cur[0], cur[1], e, undefined]);
            } else {
              setResult([[], false, e, undefined]);
            }
          }
        }
      })();
      return () => {
        disposed = true;
      };
    }
  }, [namespace, options, nextPageToken, localCacheKey, getRuns]);
  return result;
};

export const useTRPipelineRuns = (
  namespace: string,
  options?: TektonResultsOptions,
  cacheKey?: string,
): [PipelineRunKind[], boolean, unknown, GetNextPage] =>
  useTRRuns<PipelineRunKind>(getPipelineRuns, namespace, options, cacheKey);

export const useTRTaskRuns = (
  namespace: string,
  options?: TektonResultsOptions,
  cacheKey?: string,
): [TaskRunKind[], boolean, unknown, GetNextPage] =>
  useTRRuns<TaskRunKind>(getTaskRuns, namespace, options, cacheKey);

export const useTRTaskRunLog = (
  namespace: string,
  taskRunName: string,
): [string, boolean, unknown] => {
  const [result, setResult] = React.useState<[string, boolean, unknown]>([null, false, undefined]);
  React.useEffect(() => {
    let disposed = false;
    if (namespace && taskRunName) {
      (async () => {
        try {
          const log = await getTaskRunLog(namespace, taskRunName);
          if (!disposed) {
            setResult([log, true, undefined]);
          }
        } catch (e) {
          if (!disposed) {
            setResult([null, false, e]);
          }
        }
      })();
    }
    return () => {
      disposed = true;
    };
  }, [namespace, taskRunName]);
  return result;
};

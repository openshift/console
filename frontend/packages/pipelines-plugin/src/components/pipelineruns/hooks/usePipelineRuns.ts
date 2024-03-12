import * as React from 'react';
import differenceBy from 'lodash-es/differenceBy';
import uniqBy from 'lodash-es/uniqBy';
import { Selector } from '@console/dynamic-plugin-sdk/src';
import {
  K8sGroupVersionKind,
  K8sResourceCommon,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import { CustomRunModelV1Beta1 } from '@console/pipelines-plugin/src/models';
import {
  CustomRunKind,
  PipelineRunGroupVersionKind,
  PipelineRunKind,
  TaskRunGroupVersionKind,
  TaskRunKind,
} from '../../../types';
import { EQ } from '../utils/tekton-results';
import { GetNextPage, useTRPipelineRuns, useTRTaskRuns } from './useTektonResults';

const useRuns = <Kind extends K8sResourceCommon>(
  groupVersionKind: K8sGroupVersionKind,
  namespace: string,
  options?: {
    selector?: Selector;
    limit?: number;
    name?: string;
  },
): [Kind[], boolean, unknown, GetNextPage] => {
  const etcdRunsRef = React.useRef<Kind[]>([]);
  const optionsMemo = useDeepCompareMemoize(options);
  const isList = !optionsMemo?.name;
  const limit = optionsMemo?.limit;
  // do not include the limit when querying etcd because result order is not sorted
  const watchOptions = React.useMemo(() => {
    // reset cached runs as the options have changed
    etcdRunsRef.current = [];
    return {
      groupVersionKind,
      namespace: namespace || undefined,
      isList,
      selector: optionsMemo?.selector,
      name: optionsMemo?.name,
    };
  }, [groupVersionKind, namespace, optionsMemo, isList]);

  const [resources, loaded, error] = useK8sWatchResource(watchOptions);

  // if a pipeline run was removed from etcd, we want to still include it in the return value without re-querying tekton-results
  const etcdRuns = React.useMemo(() => {
    if (!loaded || error) {
      return [];
    }
    const resourcesArray = (isList ? resources : [resources]) as Kind[];

    return resourcesArray;
  }, [isList, resources, loaded, error]);

  const runs = React.useMemo(() => {
    if (!etcdRuns) {
      return etcdRuns;
    }
    let value = etcdRunsRef.current
      ? [
          ...etcdRuns,
          // identify the runs that were removed
          ...differenceBy(etcdRunsRef.current, etcdRuns, (plr) => plr.metadata.name),
        ]
      : [...etcdRuns];
    value.sort((a, b) => b.metadata.creationTimestamp.localeCompare(a.metadata.creationTimestamp));
    if (limit && limit < value.length) {
      value = value.slice(0, limit);
    }
    return value;
  }, [etcdRuns, limit]);

  // cache the last set to identify removed runs
  etcdRunsRef.current = runs;

  // Query tekton results if there's no limit or we received less items from etcd than the current limit
  const queryTr =
    !limit || (namespace && ((runs && loaded && optionsMemo.limit > runs.length) || error));

  const trOptions: typeof optionsMemo = React.useMemo(() => {
    if (optionsMemo?.name) {
      const { name, ...rest } = optionsMemo;
      return {
        ...rest,
        filter: EQ('data.metadata.name', name),
      };
    }
    return optionsMemo;
  }, [optionsMemo]);

  // tekton-results includes items in etcd, therefore options must use the same limit
  // these duplicates will later be de-duped
  const [trResources, trLoaded, trError, trGetNextPage] = (groupVersionKind ===
    PipelineRunGroupVersionKind
    ? useTRPipelineRuns
    : useTRTaskRuns)(queryTr ? namespace : null, trOptions) as [[], boolean, unknown, GetNextPage];

  return React.useMemo(() => {
    const rResources =
      runs && trResources
        ? uniqBy([...runs, ...trResources], (r) => r.metadata.uid)
        : runs || trResources;
    return [
      rResources,
      !!rResources?.[0],
      namespace
        ? queryTr
          ? isList
            ? trError || error
            : // when searching by name, return an error if we have no result
              trError || (trLoaded && !trResources.length ? error : undefined)
          : error
        : undefined,
      trGetNextPage,
    ];
  }, [runs, trResources, trLoaded, namespace, queryTr, isList, trError, error, trGetNextPage]);
};

export const usePipelineRuns = (
  namespace: string,
  options?: {
    selector?: Selector;
    limit?: number;
  },
): [PipelineRunKind[], boolean, unknown, GetNextPage] =>
  useRuns<PipelineRunKind>(PipelineRunGroupVersionKind, namespace, options);

export const useTaskRuns = (
  namespace: string,
  options?: {
    selector?: Selector;
    limit?: number;
  },
): [TaskRunKind[], boolean, unknown, GetNextPage] =>
  useRuns<TaskRunKind>(TaskRunGroupVersionKind, namespace, options);

export const useCustomRuns = (namespace: string): [CustomRunKind[], boolean, any] => {
  const watchedResource = React.useMemo(
    () => ({
      isList: true,
      groupVersionKind: {
        group: CustomRunModelV1Beta1.apiGroup,
        kind: CustomRunModelV1Beta1.kind,
        version: CustomRunModelV1Beta1.apiVersion,
      },
      namespace,
      namespaced: true,
    }),
    [namespace],
  );

  return useK8sWatchResource<CustomRunKind[]>(watchedResource);
};

export const usePipelineRun = (
  namespace: string,
  pipelineRunName: string,
): [PipelineRunKind, boolean, string] => {
  const result = (usePipelineRuns(
    namespace,
    React.useMemo(
      () => ({
        name: pipelineRunName,
        limit: 1,
      }),
      [pipelineRunName],
    ),
  ) as unknown) as [PipelineRunKind[], boolean, string];

  return React.useMemo(() => [result[0]?.[0], result[1], result[0]?.[0] ? undefined : result[2]], [
    result,
  ]);
};

export const useTaskRun = (
  namespace: string,
  taskRunName: string,
): [TaskRunKind, boolean, string] => {
  const result = (useTaskRuns(
    namespace,
    React.useMemo(
      () => ({
        name: taskRunName,
        limit: 1,
      }),
      [taskRunName],
    ),
  ) as unknown) as [TaskRunKind[], boolean, string];

  return React.useMemo(() => [result[0]?.[0], result[1], result[0]?.[0] ? undefined : result[2]], [
    result,
  ]);
};

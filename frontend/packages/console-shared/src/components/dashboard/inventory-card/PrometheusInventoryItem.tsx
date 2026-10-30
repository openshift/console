import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { PrometheusEndpoint } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type { StatusGroup } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { PrometheusStatusGroupMapper } from '@console/dynamic-plugin-sdk/src/extensions/dashboards';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { StatusGroupInventoryItem } from './InventoryItem';

interface PrometheusInventoryItemProps {
  model: K8sModel;
  query: string | (() => string);
  prometheusIsAvailable: boolean | undefined;
  mapper: PrometheusStatusGroupMapper;
  namespace?: string;
  basePath?: string;
  keepPreviousData?: boolean;
}

interface PreviousInventory {
  groups: StatusGroup;
  model: K8sModel;
  namespace: string;
  basePath: string;
  mapper: PrometheusStatusGroupMapper;
}

export const PrometheusInventoryItem: FC<PrometheusInventoryItemProps> = ({
  model,
  query,
  mapper,
  namespace,
  basePath,
  prometheusIsAvailable,
  keepPreviousData = false,
}) => {
  const [resolvedQuery, queryError] = useMemo(() => {
    try {
      return [typeof query === 'function' ? query() : query, false] as const;
    } catch {
      return ['', true] as const;
    }
  }, [query]);
  const [response, error, loading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: prometheusIsAvailable ? resolvedQuery : '',
    namespace,
  });
  const [groups, mapperError] = useMemo(() => {
    if (!response || response.status !== 'success' || response.data?.resultType !== 'vector') {
      return [{}, !!response] as const;
    }
    try {
      const result = mapper(response);
      if (
        !result ||
        typeof result !== 'object' ||
        Array.isArray(result) ||
        !Object.values(result).every(
          (group) =>
            group &&
            Number.isSafeInteger(group.count) &&
            group.count >= 0 &&
            Array.isArray(group.statusIDs) &&
            group.statusIDs.every((id) => typeof id === 'string') &&
            (group.filterType === undefined || typeof group.filterType === 'string'),
        )
      ) {
        return [{}, true] as const;
      }
      return [result, false] as const;
    } catch {
      return [{}, true] as const;
    }
  }, [response, mapper]);

  const [previous, setPrevious] = useState<PreviousInventory>();
  if (
    keepPreviousData &&
    response &&
    !loading &&
    !error &&
    !mapperError &&
    !queryError &&
    previous?.groups !== groups
  ) {
    setPrevious({ groups, model, namespace, basePath, mapper });
  }
  const retained =
    keepPreviousData &&
    loading &&
    previous?.model === model &&
    previous.namespace === namespace &&
    previous.basePath === basePath &&
    previous.mapper === mapper;

  return (
    <StatusGroupInventoryItem
      kind={model}
      groups={retained ? previous.groups : groups}
      namespace={namespace}
      basePath={basePath}
      isLoading={prometheusIsAvailable === undefined || !resolvedQuery || (loading && !retained)}
      error={prometheusIsAvailable === false || queryError || !!error || mapperError}
      dataTest="resource-inventory-item"
    />
  );
};

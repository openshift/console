import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardHeader,
  CardTitle,
  CardActions,
  Select,
  SelectOption,
  SelectVariant,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import {
  ClusterOverviewUtilizationItem,
  isClusterOverviewUtilizationItem,
  ClusterOverviewMultilineUtilizationItem,
  isClusterOverviewMultilineUtilizationItem,
  useResolvedExtensions,
  Humanize,
  TopConsumerPopoverProps,
} from '@console/dynamic-plugin-sdk';
import UtilizationItem, {
  MultilineUtilizationItem,
  QueryWithDescription,
  LimitRequested,
  trimSecondsXMutator,
} from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';

import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import {
  humanizeBinaryBytes,
  humanizeCpuCores,
  humanizeNumber,
  humanizeDecimalBytesPerSec,
} from '../../../utils/units';
import { getRangeVectorStats, getInstantVectorStats } from '../../../graphs/utils';
import {
  getMultilineQueries,
  getUtilizationQueries,
  OverviewQuery,
} from '@console/shared/src/promql/cluster-dashboard';
import { MachineConfigPoolModel } from '../../../../models';
import { getPrometheusQueryResponse } from '../../../../actions/dashboards';
import { DataPoint, PrometheusResponse } from '../../../graphs';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { MachineConfigPoolKind, referenceForModel } from '@console/internal/module/k8s';
import { UtilizationDurationDropdown } from '@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown';
import { useUtilizationDuration } from '@console/shared/src/hooks/useUtilizationDuration';
import {
  ClusterUtilizationContext,
  CPUPopover,
  MemoryPopover,
  StoragePopover,
  NetworkInPopover,
  NetworkOutPopover,
  PodPopover,
} from './utilization-popovers';

const networkPopovers = [NetworkInPopover, NetworkOutPopover];

export const PrometheusUtilizationItem = withDashboardResources<PrometheusUtilizationItemProps>(
  ({
    watchPrometheus,
    stopWatchPrometheusQuery,
    prometheusResults,
    utilizationQuery,
    totalQuery,
    title,
    TopConsumerPopover,
    humanizeValue,
    byteDataType,
    namespace,
    isDisabled = false,
    limitQuery,
    requestQuery,
    setLimitReqState,
  }) => {
    let utilization: PrometheusResponse, utilizationError: any;
    let total: PrometheusResponse, totalError: any;
    let max: DataPoint<number>[];
    let limit: PrometheusResponse, limitError: any;
    let request: PrometheusResponse, requestError: any;
    let isLoading = false;
    const { duration } = useUtilizationDuration();

    React.useEffect(() => {
      if (!isDisabled) {
        watchPrometheus(utilizationQuery, namespace, duration);
        totalQuery && watchPrometheus(totalQuery, namespace);
        limitQuery && watchPrometheus(limitQuery, namespace, duration);
        requestQuery && watchPrometheus(requestQuery, namespace, duration);
        return () => {
          stopWatchPrometheusQuery(utilizationQuery, duration);
          totalQuery && stopWatchPrometheusQuery(totalQuery);
          limitQuery && stopWatchPrometheusQuery(limitQuery, duration);
          requestQuery && stopWatchPrometheusQuery(requestQuery, duration);
        };
      }
    }, [
      watchPrometheus,
      stopWatchPrometheusQuery,
      duration,
      utilizationQuery,
      totalQuery,
      namespace,
      isDisabled,
      limitQuery,
      requestQuery,
    ]);

    if (!isDisabled) {
      [utilization, utilizationError] = getPrometheusQueryResponse(
        prometheusResults,
        utilizationQuery,
        duration,
      );
      [total, totalError] = getPrometheusQueryResponse(prometheusResults, totalQuery);
      [limit, limitError] = getPrometheusQueryResponse(prometheusResults, limitQuery, duration);
      [request, requestError] = getPrometheusQueryResponse(
        prometheusResults,
        requestQuery,
        duration,
      );

      max = getInstantVectorStats(total);
      isLoading = !utilization || (totalQuery && !total) || (limitQuery && !limit);
    }

    return (
      <UtilizationItem
        title={title}
        utilization={utilization}
        limit={limit}
        requested={request}
        error={utilizationError || totalError || limitError || requestError}
        isLoading={isLoading}
        humanizeValue={humanizeValue}
        byteDataType={byteDataType}
        query={[utilizationQuery, limitQuery, requestQuery]}
        max={max && max.length ? max[0].y : null}
        TopConsumerPopover={TopConsumerPopover}
        setLimitReqState={setLimitReqState}
      />
    );
  },
);

export const PrometheusMultilineUtilizationItem = withDashboardResources<
  PrometheusMultilineUtilizationItemProps
>(
  ({
    watchPrometheus,
    stopWatchPrometheusQuery,
    prometheusResults,
    queries,
    title,
    TopConsumerPopovers,
    humanizeValue,
    byteDataType,
    namespace,
    isDisabled = false,
  }) => {
    const { duration } = useUtilizationDuration();
    React.useEffect(() => {
      if (!isDisabled) {
        queries.forEach((q) => watchPrometheus(q.query, namespace, duration));
        return () => {
          queries.forEach((q) => stopWatchPrometheusQuery(q.query, duration));
        };
      }
    }, [watchPrometheus, stopWatchPrometheusQuery, duration, queries, namespace, isDisabled]);

    const stats = [];
    let hasError = false;
    let isLoading = false;
    if (!isDisabled) {
      queries.forEach((query) => {
        const [response, responseError] = getPrometheusQueryResponse(
          prometheusResults,
          query.query,
          duration,
        );
        if (responseError) {
          hasError = true;
          return false;
        }
        if (!response) {
          isLoading = true;
          return false;
        }
        stats.push(getRangeVectorStats(response, query.desc, null, trimSecondsXMutator)?.[0] || []);
      });
    }

    return (
      <MultilineUtilizationItem
        title={title}
        data={stats}
        error={hasError}
        isLoading={isLoading}
        humanizeValue={humanizeValue}
        byteDataType={byteDataType}
        queries={queries}
        TopConsumerPopovers={TopConsumerPopovers}
      />
    );
  },
);

const UtilizationCardNodeFilter: React.FC<UtilizationCardNodeFilterProps> = ({
  machineConfigPools,
  onNodeSelect,
  selectedNodes,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const sortedMCPs = machineConfigPools.sort((a, b) => {
    const order = ['worker', 'master'];
    const indexA = order.indexOf(a.metadata.name);
    const indexB = order.indexOf(b.metadata.name);
    if (indexA === -1 && indexB === -1) {
      return a.metadata.name.localeCompare(b.metadata.name);
    }
    if (indexA === -1) {
      return 1;
    }
    if (indexB === -1) {
      return -1;
    }
    return indexA - indexB;
  });
  const onToggle = (open: boolean): void => setIsOpen(open);

  const selectedNodesUpdated = selectedNodes.map((item) =>
    item === 'master' ? 'control plane' : item,
  );

  return (
    <Select
      variant={SelectVariant.checkbox}
      aria-label={t('public~Filter by Node type')}
      onToggle={onToggle}
      onSelect={onNodeSelect}
      selections={selectedNodesUpdated}
      isOpen={isOpen}
      placeholderText={t('public~Filter by Node type')}
      isPlain
    >
      {sortedMCPs.map((mcp) => (
        <SelectOption
          key={mcp.metadata.name}
          value={mcp.metadata.name === 'master' ? 'control plane' : mcp.metadata.name}
        />
      ))}
    </Select>
  );
};

export const UtilizationCard = () => {
  const { t } = useTranslation();
  const [machineConfigPools, machineConfigPoolsLoaded] = useK8sWatchResource<
    MachineConfigPoolKind[]
  >({
    isList: true,
    kind: referenceForModel(MachineConfigPoolModel),
  });
  // TODO: add `useUserSettings` to get default selected
  const [selectedNodes, setSelectedNodes] = React.useState<string[]>([]);

  const [dynamicItemExtensions] = useResolvedExtensions<ClusterOverviewUtilizationItem>(
    isClusterOverviewUtilizationItem,
  );
  const [dynamicMultilineItemExtensions] = useResolvedExtensions<
    ClusterOverviewMultilineUtilizationItem
  >(isClusterOverviewMultilineUtilizationItem);

  // TODO: add `useUserSettingsCompatibility` to store selectedNodes
  const onNodeSelect = (event: React.MouseEvent, selection: string) => {
    const selectionUpdated = selection === 'control plane' ? 'master' : selection;
    if (selectedNodes.includes(selectionUpdated)) {
      setSelectedNodes(selectedNodes.filter((item) => item !== selectionUpdated));
    } else {
      setSelectedNodes([...selectedNodes, selectionUpdated]);
    }
  };
  // if no filter is applied, show all nodes using regex
  const nodeType = _.isEmpty(selectedNodes) ? '.+' : selectedNodes.join('|');
  const [utilizationQueries, multilineQueries] = React.useMemo(
    () => [getUtilizationQueries(nodeType), getMultilineQueries(nodeType)],
    [nodeType],
  );
  return (
    machineConfigPoolsLoaded && (
      <Card data-test-id="utilization-card">
        <CardHeader>
          <CardTitle data-test="utilization-card__title">
            {t('public~Cluster utilization')}
          </CardTitle>
          <CardActions>
            <Split>
              <SplitItem>
                <UtilizationCardNodeFilter
                  machineConfigPools={machineConfigPools}
                  onNodeSelect={onNodeSelect}
                  selectedNodes={selectedNodes}
                />
              </SplitItem>
              <SplitItem>
                <UtilizationDurationDropdown />
              </SplitItem>
            </Split>
          </CardActions>
        </CardHeader>
        <UtilizationBody>
          <ClusterUtilizationContext.Provider value={nodeType}>
            <PrometheusUtilizationItem
              title={t('public~CPU')}
              utilizationQuery={utilizationQueries[OverviewQuery.CPU_UTILIZATION].utilization}
              totalQuery={utilizationQueries[OverviewQuery.CPU_UTILIZATION].total}
              requestQuery={utilizationQueries[OverviewQuery.CPU_UTILIZATION].requests}
              TopConsumerPopover={CPUPopover}
              humanizeValue={humanizeCpuCores}
            />
            <PrometheusUtilizationItem
              title={t('public~Memory')}
              utilizationQuery={utilizationQueries[OverviewQuery.MEMORY_UTILIZATION].utilization}
              totalQuery={utilizationQueries[OverviewQuery.MEMORY_UTILIZATION].total}
              requestQuery={utilizationQueries[OverviewQuery.MEMORY_UTILIZATION].requests}
              TopConsumerPopover={MemoryPopover}
              humanizeValue={humanizeBinaryBytes}
              byteDataType={ByteDataTypes.BinaryBytes}
            />
            <PrometheusUtilizationItem
              title={t('public~Filesystem')}
              utilizationQuery={utilizationQueries[OverviewQuery.STORAGE_UTILIZATION].utilization}
              totalQuery={utilizationQueries[OverviewQuery.STORAGE_UTILIZATION].total}
              TopConsumerPopover={StoragePopover}
              humanizeValue={humanizeBinaryBytes}
              byteDataType={ByteDataTypes.BinaryBytes}
            />
            <PrometheusMultilineUtilizationItem
              title={t('public~Network transfer')}
              queries={multilineQueries[OverviewQuery.NETWORK_UTILIZATION]}
              humanizeValue={humanizeDecimalBytesPerSec}
              TopConsumerPopovers={networkPopovers}
            />
            <PrometheusUtilizationItem
              title={t('public~Pod count')}
              utilizationQuery={utilizationQueries[OverviewQuery.POD_UTILIZATION].utilization}
              TopConsumerPopover={PodPopover}
              humanizeValue={humanizeNumber}
            />
            {dynamicItemExtensions.map(({ uid, properties }) => (
              <PrometheusUtilizationItem
                key={uid}
                title={properties.title}
                utilizationQuery={properties.getUtilizationQuery(selectedNodes)}
                totalQuery={properties.getTotalQuery?.(selectedNodes)}
                humanizeValue={properties.humanize}
                TopConsumerPopover={properties.TopConsumerPopover}
                requestQuery={properties.getRequestQuery?.(selectedNodes)}
                limitQuery={properties.getLimitQuery?.(selectedNodes)}
              />
            ))}
            {dynamicMultilineItemExtensions.map(({ uid, properties }) => (
              <PrometheusMultilineUtilizationItem
                key={uid}
                title={properties.title}
                queries={properties.getUtilizationQueries(selectedNodes)}
                humanizeValue={properties.humanize}
                TopConsumerPopovers={properties.TopConsumerPopovers}
              />
            ))}
          </ClusterUtilizationContext.Provider>
        </UtilizationBody>
      </Card>
    )
  );
};

type PrometheusCommonProps = {
  title: string;
  humanizeValue: Humanize;
  byteDataType?: ByteDataTypes;
  namespace?: string;
  isDisabled?: boolean;
};

type PrometheusUtilizationItemProps = DashboardItemProps &
  PrometheusCommonProps & {
    utilizationQuery: string;
    totalQuery?: string;
    limitQuery?: string;
    requestQuery?: string;
    TopConsumerPopover?: React.ComponentType<TopConsumerPopoverProps>;
    setLimitReqState?: (state: LimitRequested) => void;
  };

type PrometheusMultilineUtilizationItemProps = DashboardItemProps &
  PrometheusCommonProps & {
    queries: QueryWithDescription[];
    TopConsumerPopovers?: React.ComponentType<TopConsumerPopoverProps>[];
  };

type UtilizationCardNodeFilterProps = {
  machineConfigPools: MachineConfigPoolKind[];
  onNodeSelect: (event: React.MouseEvent, selection: string) => void;
  selectedNodes: string[];
};

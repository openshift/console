import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationItem, {
  TopConsumerPopoverProp,
  MultilineUtilizationItem,
  QueryWithDescription,
  LimitRequested,
  trimSecondsXMutator,
} from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import {
  Flex,
  FlexItem,
  PopoverPosition,
  Select,
  SelectOption,
  SelectVariant,
} from '@patternfly/react-core';
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
  getTop25ConsumerQueries,
  getUtilizationQueries,
  OverviewQuery,
} from '@console/shared/src/promql/cluster-dashboard';
import { MachineConfigPoolModel, NodeModel, PodModel, ProjectModel } from '../../../../models';
import { getPrometheusQueryResponse } from '../../../../actions/dashboards';
import { Humanize } from '../../../utils/types';
import { DataPoint, PrometheusResponse } from '../../../graphs';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { MachineConfigPoolKind, referenceForModel } from '@console/internal/module/k8s';
import { UtilizationDurationDropdown } from '@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown';
import { useUtilizationDuration } from '@console/shared/src/hooks/useUtilizationDuration';

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

  return (
    <Select
      variant={SelectVariant.checkbox}
      aria-label={t('public~Filter by Node type')}
      onToggle={onToggle}
      onSelect={onNodeSelect}
      selections={selectedNodes}
      isOpen={isOpen}
      placeholderText={t('public~Filter by Node type')}
    >
      {sortedMCPs.map((mcp) => (
        <SelectOption key={mcp.metadata.name} value={mcp.metadata.name} />
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
  // TODO: add `useUserSettingsCompatibility` to store selectedNodes
  const onNodeSelect = (event: React.MouseEvent, selection: string) => {
    if (selectedNodes.includes(selection)) {
      setSelectedNodes(selectedNodes.filter((item) => item !== selection));
    } else {
      setSelectedNodes([...selectedNodes, selection]);
    }
  };
  // if no filter is applied, show all nodes using regex
  const nodeType = _.isEmpty(selectedNodes) ? '.+' : selectedNodes.join('|');
  const consumerQueries = React.useMemo(() => getTop25ConsumerQueries(nodeType), [nodeType]);
  const utilizationQueries = React.useMemo(() => getUtilizationQueries(nodeType), [nodeType]);
  const multilineQueries = React.useMemo(() => getMultilineQueries(nodeType), [nodeType]);

  const cpuPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title={t('public~CPU')}
        current={current}
        consumers={[
          {
            query: consumerQueries[OverviewQuery.PROJECTS_BY_CPU],
            model: ProjectModel,
            metric: 'namespace',
          },
          {
            query: consumerQueries[OverviewQuery.PODS_BY_CPU],
            model: PodModel,
            metric: 'pod',
          },
          {
            query: consumerQueries[OverviewQuery.NODES_BY_CPU],
            model: NodeModel,
            metric: 'instance',
          },
        ]}
        humanize={humanizeCpuCores}
        position={PopoverPosition.top}
      />
    )),
    [],
  );

  const memPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title={t('public~Memory')}
        current={current}
        consumers={[
          {
            query: consumerQueries[OverviewQuery.PROJECTS_BY_MEMORY],
            model: ProjectModel,
            metric: 'namespace',
          },
          {
            query: consumerQueries[OverviewQuery.PODS_BY_MEMORY],
            model: PodModel,
            metric: 'pod',
          },
          {
            query: consumerQueries[OverviewQuery.NODES_BY_MEMORY],
            model: NodeModel,
            metric: 'instance',
          },
        ]}
        humanize={humanizeBinaryBytes}
        position={PopoverPosition.top}
      />
    )),
    [],
  );

  const storagePopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title={t('public~Filesystem')}
        current={current}
        consumers={[
          {
            query: consumerQueries[OverviewQuery.PROJECTS_BY_STORAGE],
            model: ProjectModel,
            metric: 'namespace',
          },
          {
            query: consumerQueries[OverviewQuery.PODS_BY_STORAGE],
            model: PodModel,
            metric: 'pod',
          },
          {
            query: consumerQueries[OverviewQuery.NODES_BY_STORAGE],
            model: NodeModel,
            metric: 'instance',
          },
        ]}
        humanize={humanizeBinaryBytes}
        position={PopoverPosition.top}
      />
    )),
    [],
  );

  const podPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title={t('public~Pod count')}
        current={current}
        consumers={[
          {
            query: consumerQueries[OverviewQuery.PROJECTS_BY_PODS],
            model: ProjectModel,
            metric: 'namespace',
          },
          {
            query: consumerQueries[OverviewQuery.NODES_BY_PODS],
            model: NodeModel,
            metric: 'node',
          },
        ]}
        humanize={humanizeNumber}
        position={PopoverPosition.top}
      />
    )),
    [],
  );

  const networkInPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title={t('public~Network in')}
        current={current}
        consumers={[
          {
            query: consumerQueries[OverviewQuery.PROJECTS_BY_NETWORK_IN],
            model: ProjectModel,
            metric: 'namespace',
          },
          {
            query: consumerQueries[OverviewQuery.PODS_BY_NETWORK_IN],
            model: PodModel,
            metric: 'pod',
          },
          {
            query: consumerQueries[OverviewQuery.NODES_BY_NETWORK_IN],
            model: NodeModel,
            metric: 'instance',
          },
        ]}
        humanize={humanizeDecimalBytesPerSec}
        position={PopoverPosition.top}
      />
    )),
    [],
  );

  const networkOutPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title={t('public~Network out')}
        current={current}
        consumers={[
          {
            query: consumerQueries[OverviewQuery.PROJECTS_BY_NETWORK_OUT],
            model: ProjectModel,
            metric: 'namespace',
          },
          {
            query: consumerQueries[OverviewQuery.PODS_BY_NETWORK_OUT],
            model: PodModel,
            metric: 'pod',
          },
          {
            query: consumerQueries[OverviewQuery.NODES_BY_NETWORK_OUT],
            model: NodeModel,
            metric: 'instance',
          },
        ]}
        humanize={humanizeDecimalBytesPerSec}
        position={PopoverPosition.top}
      />
    )),
    [],
  );

  return (
    machineConfigPoolsLoaded && (
      <DashboardCard data-test-id="utilization-card">
        <DashboardCardHeader>
          <DashboardCardTitle>{t('public~Cluster utilization')}</DashboardCardTitle>
          <Flex>
            <FlexItem>
              <UtilizationCardNodeFilter
                machineConfigPools={machineConfigPools}
                onNodeSelect={onNodeSelect}
                selectedNodes={selectedNodes}
              />
            </FlexItem>
            <UtilizationDurationDropdown />
          </Flex>
        </DashboardCardHeader>
        <UtilizationBody>
          <PrometheusUtilizationItem
            title={t('public~CPU')}
            utilizationQuery={utilizationQueries[OverviewQuery.CPU_UTILIZATION].utilization}
            totalQuery={utilizationQueries[OverviewQuery.CPU_UTILIZATION].total}
            requestQuery={utilizationQueries[OverviewQuery.CPU_UTILIZATION].requests}
            TopConsumerPopover={cpuPopover}
            humanizeValue={humanizeCpuCores}
          />
          <PrometheusUtilizationItem
            title={t('public~Memory')}
            utilizationQuery={utilizationQueries[OverviewQuery.MEMORY_UTILIZATION].utilization}
            totalQuery={utilizationQueries[OverviewQuery.MEMORY_UTILIZATION].total}
            requestQuery={utilizationQueries[OverviewQuery.MEMORY_UTILIZATION].requests}
            TopConsumerPopover={memPopover}
            humanizeValue={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
          />
          <PrometheusUtilizationItem
            title={t('public~Filesystem')}
            utilizationQuery={utilizationQueries[OverviewQuery.STORAGE_UTILIZATION].utilization}
            totalQuery={utilizationQueries[OverviewQuery.STORAGE_UTILIZATION].total}
            TopConsumerPopover={storagePopover}
            humanizeValue={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
          />
          <PrometheusMultilineUtilizationItem
            title={t('public~Network transfer')}
            queries={multilineQueries[OverviewQuery.NETWORK_UTILIZATION]}
            humanizeValue={humanizeDecimalBytesPerSec}
            TopConsumerPopovers={[networkInPopover, networkOutPopover]}
          />
          <PrometheusUtilizationItem
            title={t('public~Pod count')}
            utilizationQuery={utilizationQueries[OverviewQuery.POD_UTILIZATION].utilization}
            TopConsumerPopover={podPopover}
            humanizeValue={humanizeNumber}
          />
        </UtilizationBody>
      </DashboardCard>
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
    TopConsumerPopover?: React.ComponentType<TopConsumerPopoverProp>;
    setLimitReqState?: (state: LimitRequested) => void;
  };

type PrometheusMultilineUtilizationItemProps = DashboardItemProps &
  PrometheusCommonProps & {
    queries: QueryWithDescription[];
    TopConsumerPopovers?: React.ComponentType<TopConsumerPopoverProp>[];
  };

type UtilizationCardNodeFilterProps = {
  machineConfigPools: MachineConfigPoolKind[];
  onNodeSelect: (event: React.MouseEvent, selection: string) => void;
  selectedNodes: string[];
};

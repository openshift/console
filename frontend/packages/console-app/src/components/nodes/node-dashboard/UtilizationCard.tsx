import * as React from 'react';
import { Card, CardHeader, CardTitle, CardActions } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  PrometheusUtilizationItem,
  PrometheusMultilineUtilizationItem,
} from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import {
  humanizeCpuCores,
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
  humanizeNumber,
} from '@console/internal/components/utils';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { UtilizationDurationDropdown } from '@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { getNodeAddresses } from '@console/shared/src/selectors/node';
import { NodeDashboardContext } from './NodeDashboardContext';
import {
  NodeQueries,
  getUtilizationQueries,
  getMultilineQueries,
  getResourceQutoaQueries,
} from './queries';
import {
  CPUPopover,
  NetworkInPopover,
  NetworkOutPopover,
  NodeUtilizationContext,
  MemoryPopover,
  FilesystemPopover,
} from './utilization-popovers';

const networkPopovers = [NetworkInPopover, NetworkOutPopover];

const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj, setCPULimit, setMemoryLimit } = React.useContext(NodeDashboardContext);

  const nodeName = obj.metadata.name;
  const nodeIP = getNodeAddresses(obj).find((addr) => addr.type === 'InternalIP')?.address;

  const [queries, multilineQueries, resourceQuotaQueries] = React.useMemo(
    () => [
      getUtilizationQueries(nodeName, nodeIP),
      getMultilineQueries(nodeName),
      getResourceQutoaQueries(nodeName),
    ],
    [nodeIP, nodeName],
  );

  return (
    <Card data-test-id="utilization-card">
      <CardHeader>
        <CardTitle>{t('console-app~Utilization')}</CardTitle>
        <CardActions>
          <UtilizationDurationDropdown />
        </CardActions>
      </CardHeader>
      <UtilizationBody>
        <NodeUtilizationContext.Provider value={{ nodeIP, nodeName }}>
          <PrometheusUtilizationItem
            title={t('console-app~CPU')}
            humanizeValue={humanizeCpuCores}
            utilizationQuery={queries[NodeQueries.CPU_USAGE]}
            totalQuery={queries[NodeQueries.CPU_TOTAL]}
            limitQuery={resourceQuotaQueries[NodeQueries.POD_RESOURCE_LIMIT_CPU]}
            requestQuery={resourceQuotaQueries[NodeQueries.POD_RESOURCE_REQUEST_CPU]}
            TopConsumerPopover={CPUPopover}
            setLimitReqState={setCPULimit}
          />
          <PrometheusUtilizationItem
            title={t('console-app~Memory')}
            humanizeValue={humanizeBinaryBytes}
            utilizationQuery={queries[NodeQueries.MEMORY_USAGE]}
            totalQuery={queries[NodeQueries.MEMORY_TOTAL]}
            limitQuery={resourceQuotaQueries[NodeQueries.POD_RESOURCE_LIMIT_MEMORY]}
            requestQuery={resourceQuotaQueries[NodeQueries.POD_RESOURCE_REQUEST_MEMORY]}
            byteDataType={ByteDataTypes.BinaryBytes}
            TopConsumerPopover={MemoryPopover}
            setLimitReqState={setMemoryLimit}
          />
          <PrometheusUtilizationItem
            title={t('console-app~Filesystem')}
            humanizeValue={humanizeBinaryBytes}
            utilizationQuery={queries[NodeQueries.FILESYSTEM_USAGE]}
            totalQuery={queries[NodeQueries.FILESYSTEM_TOTAL]}
            byteDataType={ByteDataTypes.BinaryBytes}
            TopConsumerPopover={FilesystemPopover}
          />
          <PrometheusMultilineUtilizationItem
            title={t('console-app~Network transfer')}
            humanizeValue={humanizeDecimalBytesPerSec}
            queries={multilineQueries[NodeQueries.NETWORK_UTILIZATION]}
            TopConsumerPopovers={networkPopovers}
          />
          <PrometheusUtilizationItem
            title={t('console-app~Pod count')}
            humanizeValue={humanizeNumber}
            utilizationQuery={queries[NodeQueries.POD_COUNT]}
          />
        </NodeUtilizationContext.Provider>
      </UtilizationBody>
    </Card>
  );
};

export default UtilizationCard;

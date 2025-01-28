import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle } from '@patternfly/react-core';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import {
  isProjectOverviewUtilizationItem,
  ProjectOverviewUtilizationItem,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk/src';
import {
  humanizeBinaryBytes,
  humanizeCpuCores,
  humanizeDecimalBytesPerSec,
  humanizeNumber,
} from '../../utils';
import { ProjectDashboardContext } from './project-dashboard-context';
import {
  getUtilizationQueries,
  ProjectQueries,
  getMultilineQueries,
} from '@console/shared/src/promql/project-dashboard';
import {
  PrometheusUtilizationItem,
  PrometheusMultilineUtilizationItem,
} from '../dashboards-page/cluster-dashboard/utilization-card';
import { UtilizationDurationDropdown } from '@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown';
import {
  CPUPopover,
  FilesystemPopover,
  MemoryPopover,
  NetworkInPopover,
  NetworkOutPopover,
  ProjectUtilizationContext,
} from './utilization-popovers';

const networkPopovers = [NetworkInPopover, NetworkOutPopover];

export const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(ProjectDashboardContext);
  const projectName = obj?.metadata?.name;
  const [queries, multilineQueries] = React.useMemo(
    () => [getUtilizationQueries(projectName), getMultilineQueries(projectName)],
    [projectName],
  );

  const [dynamicItemExtensions] = useResolvedExtensions<ProjectOverviewUtilizationItem>(
    isProjectOverviewUtilizationItem,
  );

  return (
    <Card data-test-id="utilization-card">
      <CardHeader
        actions={{
          actions: (
            <>
              <UtilizationDurationDropdown />
            </>
          ),
          hasNoOffset: false,
          className: undefined,
        }}
      >
        <CardTitle>{t('public~Utilization')}</CardTitle>
      </CardHeader>
      <UtilizationBody>
        <ProjectUtilizationContext.Provider value={projectName}>
          <PrometheusUtilizationItem
            title={t('public~CPU')}
            humanizeValue={humanizeCpuCores}
            utilizationQuery={queries[ProjectQueries.CPU_USAGE]}
            requestQuery={queries[ProjectQueries.CPU_REQUESTS]}
            TopConsumerPopover={CPUPopover}
            namespace={projectName}
          />
          <PrometheusUtilizationItem
            title={t('public~Memory')}
            humanizeValue={humanizeBinaryBytes}
            utilizationQuery={queries[ProjectQueries.MEMORY_USAGE]}
            requestQuery={queries[ProjectQueries.MEMORY_REQUESTS]}
            byteDataType={ByteDataTypes.BinaryBytes}
            TopConsumerPopover={MemoryPopover}
            namespace={projectName}
          />
          <PrometheusUtilizationItem
            title={t('public~Filesystem')}
            humanizeValue={humanizeBinaryBytes}
            utilizationQuery={queries[ProjectQueries.FILESYSTEM_USAGE]}
            byteDataType={ByteDataTypes.BinaryBytes}
            TopConsumerPopover={FilesystemPopover}
            namespace={projectName}
          />
          <PrometheusMultilineUtilizationItem
            title={t('public~Network transfer')}
            humanizeValue={humanizeDecimalBytesPerSec}
            queries={multilineQueries[ProjectQueries.NETWORK_UTILIZATION]}
            TopConsumerPopovers={networkPopovers}
            namespace={projectName}
          />
          <PrometheusUtilizationItem
            title={t('public~Pod count')}
            humanizeValue={humanizeNumber}
            utilizationQuery={queries[ProjectQueries.POD_COUNT]}
            namespace={projectName}
          />
          {dynamicItemExtensions.map(({ uid, properties }) => (
            <PrometheusUtilizationItem
              key={uid}
              title={properties.title}
              humanizeValue={properties.humanize}
              utilizationQuery={properties.getUtilizationQuery(projectName)}
              requestQuery={properties.getRequestQuery?.(projectName)}
              limitQuery={properties.getLimitQuery?.(projectName)}
              totalQuery={properties.getTotalQuery?.(projectName)}
              namespace={projectName}
              TopConsumerPopover={properties.TopConsumerPopover}
            />
          ))}
        </ProjectUtilizationContext.Provider>
      </UtilizationBody>
    </Card>
  );
};

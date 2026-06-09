import type { FC } from 'react';
import { useState, useMemo } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  ExpandableSectionToggle,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  getMultilineQueries,
  getUtilizationQueries,
  NodeQueries,
} from '@console/app/src/components/nodes/node-dashboard/queries';
import type { NodeKind } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { SectionHeading } from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { QueryBrowser } from '@console/shared/src/components/query-browser/QueryBrowser';

type NodePerformanceProps = {
  obj: NodeKind;
};

type ChartConfig = {
  title: string;
  queries: string[];
  units?: string;
  isStack?: boolean;
};

type RowConfig = {
  title: string;
  charts: ChartConfig[];
};

const PerformanceChart: FC<{ config: ChartConfig }> = ({ config }) => (
  <Card isFullHeight>
    <CardHeader>
      <CardTitle>{config.title}</CardTitle>
    </CardHeader>
    <CardBody>
      <QueryBrowser
        queries={config.queries}
        disableZoom
        hideControls
        units={config.units}
        isStack={config.isStack}
      />
    </CardBody>
  </Card>
);

type PerformanceRowProps = {
  row: RowConfig;
  defaultExpanded?: boolean;
};

const PerformanceRow: FC<PerformanceRowProps> = ({ row, defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  return (
    <Flex direction={{ default: 'column' }} data-test-id={`panel-${row.title.toLowerCase()}`}>
      <FlexItem>
        <ExpandableSectionToggle
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded((prev) => !prev)}
        >
          <span className="pf-v6-u-font-size-lg pf-v6-u-font-weight-bold">{row.title}</span>
        </ExpandableSectionToggle>
      </FlexItem>
      {isExpanded && (
        <FlexItem>
          <Grid hasGutter>
            {row.charts.map((chart) => (
              <GridItem key={chart.title} xl={6} lg={12}>
                <PerformanceChart config={chart} />
              </GridItem>
            ))}
          </Grid>
        </FlexItem>
      )}
    </Flex>
  );
};

const NodePerformance: FC<NodePerformanceProps> = ({ obj }) => {
  const { t } = useTranslation('console-app');
  const nodeName = obj?.metadata?.name;

  const rows: RowConfig[] = useMemo(() => {
    const utilizationQueries = getUtilizationQueries(nodeName, '');
    const networkQueries = getMultilineQueries(nodeName)[NodeQueries.NETWORK_UTILIZATION];

    return [
      {
        title: t('CPU'),
        charts: [
          {
            title: t('CPU Utilization'),
            queries: [utilizationQueries[NodeQueries.CPU_USAGE]],
            units: 'cores',
            isStack: true,
          },
          {
            title: t('CPU Saturation (Load per CPU)'),
            queries: [
              `node_load1{instance='${nodeName}'} / instance:node_num_cpu:sum{instance='${nodeName}'}`,
            ],
            isStack: true,
          },
        ],
      },
      {
        title: t('Memory'),
        charts: [
          {
            title: t('Memory Utilization'),
            queries: [utilizationQueries[NodeQueries.MEMORY_USAGE]],
            units: 'bytes',
            isStack: true,
          },
          {
            title: t('Memory Saturation (Major Page Faults)'),
            queries: [`rate(node_vmstat_pgmajfault{instance='${nodeName}'}[5m])`],
            isStack: true,
          },
        ],
      },
      {
        title: t('Network'),
        charts: [
          {
            title: t('Network Utilization (Bytes Received/Transmitted)'),
            queries: [networkQueries[0].query, networkQueries[1].query],
            units: 'Bps',
            isStack: true,
          },
          {
            title: t('Network Saturation (Drops Received/Transmitted)'),
            queries: [
              `sum(rate(node_network_receive_drop_total{instance='${nodeName}'}[5m]))`,
              `sum(rate(node_network_transmit_drop_total{instance='${nodeName}'}[5m]))`,
            ],
            isStack: true,
          },
        ],
      },
      {
        title: t('Disk IO'),
        charts: [
          {
            title: t('Disk IO Utilization'),
            queries: [
              `sum(rate(node_disk_read_bytes_total{instance='${nodeName}'}[5m]))`,
              `sum(rate(node_disk_written_bytes_total{instance='${nodeName}'}[5m]))`,
            ],
            units: 'Bps',
            isStack: true,
          },
          {
            title: t('Disk IO Saturation'),
            queries: [
              `sum(rate(node_disk_read_time_seconds_total{instance='${nodeName}'}[5m]))`,
              `sum(rate(node_disk_write_time_seconds_total{instance='${nodeName}'}[5m]))`,
            ],
            isStack: true,
          },
        ],
      },
    ];
  }, [nodeName, t]);

  return (
    <PaneBody>
      <SectionHeading text={t('Performance')} />
      <Flex
        className="pf-v6-u-px-md"
        direction={{ default: 'column' }}
        spaceItems={{ default: 'spaceItemsLg' }}
      >
        {rows.map((row) => (
          <FlexItem key={row.title}>
            <PerformanceRow row={row} />
          </FlexItem>
        ))}
      </Flex>
    </PaneBody>
  );
};

export default NodePerformance;

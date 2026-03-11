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
import type { NodeKind } from '@console/dynamic-plugin-sdk';
import { SectionHeading } from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { QueryBrowser } from '@console/shared/src/components/query-browser';

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
  const { t } = useTranslation();
  const nodeName = obj?.metadata?.name;

  const rows: RowConfig[] = useMemo(
    () => [
      {
        title: t('console-app~CPU'),
        charts: [
          {
            title: t('console-app~CPU Utilisation'),
            queries: [`instance:node_cpu:rate:sum{instance='${nodeName}'}`],
            units: 'cores',
            isStack: true,
          },
          {
            title: t('console-app~CPU Saturation (Load per CPU)'),
            queries: [
              `node_load1{instance='${nodeName}'} / instance:node_num_cpu:sum{instance='${nodeName}'}`,
            ],
            isStack: true,
          },
        ],
      },
      {
        title: t('console-app~Memory'),
        charts: [
          {
            title: t('console-app~Memory Utilisation'),
            queries: [
              `node_memory_MemTotal_bytes{instance='${nodeName}'} - node_memory_MemAvailable_bytes{instance='${nodeName}'}`,
            ],
            units: 'bytes',
            isStack: true,
          },
          {
            title: t('console-app~Memory Saturation (Major Page Faults)'),
            queries: [`rate(node_vmstat_pgmajfault{instance='${nodeName}'}[5m])`],
            isStack: true,
          },
        ],
      },
      {
        title: t('console-app~Network'),
        charts: [
          {
            title: t('console-app~Network Utilisation (Bytes Receive/Transmit)'),
            queries: [
              `instance:node_network_receive_bytes:rate:sum{instance='${nodeName}'}`,
              `instance:node_network_transmit_bytes:rate:sum{instance='${nodeName}'}`,
            ],
            units: 'Bps',
            isStack: true,
          },
          {
            title: t('console-app~Network Saturation (Drops Receive/Transmit)'),
            queries: [
              `sum(rate(node_network_receive_drop_total{instance='${nodeName}'}[5m]))`,
              `sum(rate(node_network_transmit_drop_total{instance='${nodeName}'}[5m]))`,
            ],
            isStack: true,
          },
        ],
      },
      {
        title: t('console-app~Disk IO'),
        charts: [
          {
            title: t('console-app~Disk IO Utilisation'),
            queries: [
              `sum(rate(node_disk_read_bytes_total{instance='${nodeName}'}[5m]))`,
              `sum(rate(node_disk_written_bytes_total{instance='${nodeName}'}[5m]))`,
            ],
            units: 'Bps',
            isStack: true,
          },
          {
            title: t('console-app~Disk IO Saturation'),
            queries: [
              `sum(rate(node_disk_read_time_seconds_total{instance='${nodeName}'}[5m]))`,
              `sum(rate(node_disk_write_time_seconds_total{instance='${nodeName}'}[5m]))`,
            ],
            isStack: true,
          },
        ],
      },
    ],
    [nodeName, t],
  );

  return (
    <PaneBody>
      <SectionHeading text={t('console-app~Performance')} />
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

import type { FC } from 'react';
import { useMemo } from 'react';
import {
  Bullseye,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Spinner,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { PrometheusResponse, PrometheusResult } from '@console/internal/components/graphs';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { SectionHeading } from '@console/internal/components/utils/headings';
import type { NodeKind } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  GpuMetricQuery,
  getGpuMetricQueries,
  nodeHasGpuCapacity,
  GPU_RESOURCE_KEYS,
} from './nodeGpuMetricsQueries';

type GpuMetricResult = {
  value: string;
  modelName?: string;
  device?: string;
};

type GpuDeviceRow = {
  id: string;
  label: string;
  utilization: string;
  temperature: string;
  power: string;
  fbUsed: string;
  fbFree: string;
};

const resultsByGpu = (
  response: PrometheusResponse | undefined,
): Record<string, GpuMetricResult> => {
  if (!response?.data?.result?.length) {
    return {};
  }
  return response.data.result.reduce<Record<string, GpuMetricResult>>(
    (acc, r: PrometheusResult) => {
      const gpu = r.metric?.gpu ?? r.metric?.GPU_I_ID ?? r.metric?.UUID ?? r.metric?.device ?? '';
      if (!gpu) {
        return acc;
      }
      acc[gpu] = {
        value: r.value?.[1] ?? '',
        modelName: r.metric?.modelName,
        device: r.metric?.device,
      };
      return acc;
    },
    {},
  );
};

const collectGpuIds = (...maps: Record<string, GpuMetricResult>[]): string[] => {
  const ids = new Set<string>();
  maps.forEach((m) => Object.keys(m).forEach((k) => ids.add(k)));
  return [...ids].sort();
};

const gpuDeviceLabel = (gpuId: string, meta: GpuMetricResult | undefined): string => {
  const index = `GPU ${gpuId}`;
  const model = meta?.modelName;
  if (model) {
    return `${index} \u2014 ${model}`;
  }
  const dev = meta?.device;
  if (dev) {
    return `${index} (${dev})`;
  }
  return index;
};

const findFirstMeta = (...maps: Record<string, GpuMetricResult>[]): GpuMetricResult | undefined => {
  for (const m of maps) {
    for (const entry of Object.values(m)) {
      if (entry.modelName) return entry;
    }
  }
  return Object.values(maps[0] ?? {})[0];
};

const formatValue = (val: string | undefined, suffix: string): string => {
  if (val === undefined || val === '') return '-';
  const num = parseFloat(val);
  if (Number.isNaN(num)) return '-';
  return `${Math.round(num * 10) / 10} ${suffix}`;
};

const formatMemMiB = (val: string | undefined): string => {
  if (val === undefined || val === '') return '-';
  const mib = parseFloat(val);
  if (Number.isNaN(mib)) return '-';
  if (mib >= 1024) return `${(mib / 1024).toFixed(1)} GiB`;
  return `${Math.round(mib)} MiB`;
};

type NodeDetailsGpuMetricsProps = {
  node: NodeKind;
};

const NodeDetailsGpuMetrics: FC<NodeDetailsGpuMetricsProps> = ({ node }) => {
  const { t } = useTranslation();
  const nodeName = node.metadata.name;

  const hasCapacity = nodeHasGpuCapacity(node.status?.capacity);

  const queries = useMemo(() => getGpuMetricQueries(nodeName), [nodeName]);

  const [countResponse, , countLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: queries[GpuMetricQuery.GPU_COUNT],
  });
  const [utilResponse, , utilLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: queries[GpuMetricQuery.GPU_UTILIZATION],
  });
  const [tempResponse, , tempLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: queries[GpuMetricQuery.GPU_TEMPERATURE],
  });
  const [powerResponse, , powerLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: queries[GpuMetricQuery.GPU_POWER_USAGE],
  });
  const [fbUsedResponse, , fbUsedLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: queries[GpuMetricQuery.GPU_FB_USED],
  });
  const [fbFreeResponse, , fbFreeLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: queries[GpuMetricQuery.GPU_FB_FREE],
  });

  const isLoading =
    countLoading || utilLoading || tempLoading || powerLoading || fbUsedLoading || fbFreeLoading;

  const utilMap = useMemo(() => resultsByGpu(utilResponse), [utilResponse]);
  const tempMap = useMemo(() => resultsByGpu(tempResponse), [tempResponse]);
  const powerMap = useMemo(() => resultsByGpu(powerResponse), [powerResponse]);
  const fbUsedMap = useMemo(() => resultsByGpu(fbUsedResponse), [fbUsedResponse]);
  const fbFreeMap = useMemo(() => resultsByGpu(fbFreeResponse), [fbFreeResponse]);

  const gpuIds = useMemo(() => collectGpuIds(utilMap, tempMap, powerMap, fbUsedMap, fbFreeMap), [
    utilMap,
    tempMap,
    powerMap,
    fbUsedMap,
    fbFreeMap,
  ]);

  const hasMetrics = gpuIds.length > 0;

  if (!hasCapacity && !isLoading && !hasMetrics) {
    return null;
  }

  const gpuCountValue = countResponse?.data?.result?.[0]?.value?.[1];
  const gpuCountStr = (() => {
    if (gpuCountValue === undefined || gpuCountValue === '') return undefined;
    const parsed = parseFloat(gpuCountValue);
    return Number.isNaN(parsed) ? undefined : String(Math.round(parsed));
  })();

  const gpuCapacityStr = GPU_RESOURCE_KEYS.map((key) => node.status?.capacity?.[key])
    .filter(Boolean)
    .join(', ');
  const gpuAllocatableStr = GPU_RESOURCE_KEYS.map((key) => node.status?.allocatable?.[key])
    .filter(Boolean)
    .join(', ');

  const firstMeta = findFirstMeta(utilMap, tempMap, powerMap, fbUsedMap, fbFreeMap);
  const gpuModelStr = firstMeta?.modelName;

  const rows: GpuDeviceRow[] = gpuIds.map((id) => {
    const meta = utilMap[id] ?? tempMap[id] ?? powerMap[id] ?? fbUsedMap[id] ?? fbFreeMap[id];
    return {
      id,
      label: gpuDeviceLabel(id, meta),
      utilization: formatValue(utilMap[id]?.value, '%'),
      temperature: formatValue(tempMap[id]?.value, '°C'),
      power: formatValue(powerMap[id]?.value, 'W'),
      fbUsed: formatMemMiB(fbUsedMap[id]?.value),
      fbFree: formatMemMiB(fbFreeMap[id]?.value),
    };
  });

  return (
    <PaneBody>
      <SectionHeading text={t('console-app~GPU metrics')} />

      {(gpuCountStr || gpuCapacityStr || gpuAllocatableStr || gpuModelStr) && (
        <Grid hasGutter>
          <GridItem md={6}>
            <DescriptionList isHorizontal>
              {gpuCountStr && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('console-app~GPU count')}</DescriptionListTerm>
                  <DescriptionListDescription>{gpuCountStr}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {gpuModelStr && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('console-app~GPU model')}</DescriptionListTerm>
                  <DescriptionListDescription>{gpuModelStr}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </DescriptionList>
          </GridItem>
          <GridItem md={6}>
            <DescriptionList isHorizontal>
              {gpuCapacityStr && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('console-app~GPU capacity')}</DescriptionListTerm>
                  <DescriptionListDescription>{gpuCapacityStr}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {gpuAllocatableStr && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('console-app~GPU allocatable')}</DescriptionListTerm>
                  <DescriptionListDescription>{gpuAllocatableStr}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </DescriptionList>
          </GridItem>
        </Grid>
      )}

      {isLoading && (
        <Bullseye>
          <Spinner size="lg" />
        </Bullseye>
      )}

      {!isLoading && hasMetrics && (
        <div className="co-table-container pf-v6-u-mt-md">
          <table
            className="pf-v6-c-table pf-m-compact pf-m-border-rows"
            aria-label={t('console-app~GPU metrics per device')}
          >
            <thead className="pf-v6-c-table__thead">
              <tr className="pf-v6-c-table__tr">
                <th className="pf-v6-c-table__th">{t('console-app~GPU device')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Utilization')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Temperature')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Power usage')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~FB memory used')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~FB memory free')}</th>
              </tr>
            </thead>
            <tbody className="pf-v6-c-table__tbody">
              {rows.map((row) => (
                <tr className="pf-v6-c-table__tr" key={row.id}>
                  <td className="pf-v6-c-table__td">{row.label}</td>
                  <td className="pf-v6-c-table__td">{row.utilization}</td>
                  <td className="pf-v6-c-table__td">{row.temperature}</td>
                  <td className="pf-v6-c-table__td">{row.power}</td>
                  <td className="pf-v6-c-table__td">{row.fbUsed}</td>
                  <td className="pf-v6-c-table__td">{row.fbFree}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !hasMetrics && hasCapacity && (
        <p className="text-secondary">
          {t(
            'console-app~GPU metrics are not available. Ensure DCGM exporter metrics are being scraped and labeled with the node name.',
          )}
        </p>
      )}
    </PaneBody>
  );
};

export default NodeDetailsGpuMetrics;

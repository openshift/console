import * as React from 'react';
import { ChartDonut, ChartLabel, ChartLegend } from '@patternfly/react-charts';
import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { LABEL_USED_TEMPLATE_NAME } from '../../../constants';
import { VirtualMachineModel } from '../../../models';
import { kubevirtReferenceForModel } from '../../../models/kubevirtReferenceForModel';
import { VMKind } from '../../../types';

import './running-vms-per-template-card.scss';

const getVMsPerTemplateMap = (vms, vmsLoaded) => {
  const map = new Map();

  if (vmsLoaded) {
    vms.forEach((vm) => {
      const template = vm?.metadata?.labels[LABEL_USED_TEMPLATE_NAME];
      const value = map.has(template) ? map.get(template) + 1 : 1;
      map.set(template, value);
    });
  }

  const numVMs = map.size;

  const vmCount = [];
  const legendLabel = [];
  const dataMap = [];

  for (const [templateName, count] of map) {
    const percent = Math.round((count / numVMs) * 100);
    dataMap.push({ x: templateName, y: percent });
    vmCount.push(count);
    legendLabel.push({ name: `${count}: ${templateName}` });
  }

  return { data: vmCount, legend: legendLabel, map: dataMap };
};

const LegendLabel = ({ values, ...rest }) => (
  <ChartLabel {...rest} className="kv-running-vms-card__chart-label" text={rest.text} />
);

// Custom legend component
const getLegend = (legendData, values) => (
  <ChartLegend
    data={legendData}
    orientation="horizontal"
    gutter={5}
    rowGutter={5}
    itemsPerRow={2}
    labelComponent={<LegendLabel lineHeight={1.5} values={values} />}
  />
);

export const RunningVMsPerTemplateCard = () => {
  const { t } = useTranslation();

  const [vms, vmsLoaded] = useK8sWatchResource<VMKind[]>({
    kind: kubevirtReferenceForModel(VirtualMachineModel),
    isList: true,
    namespaced: false,
  });

  const graphData = React.useMemo(() => getVMsPerTemplateMap(vms, vmsLoaded), [vms, vmsLoaded]);
  const vmsPerTemplateMap = graphData.data;
  const legendData = graphData.legend;
  const dataMap = graphData.map;

  const chart = (
    <div>
      <ChartDonut
        ariaDesc={t('kubevirt-plugin~Running VMs per template')}
        ariaTitle={t('kubevirt-plugin~Running VMs per template donut chart')}
        data={dataMap}
        height={200}
        labels={({ datum }) => `${datum.x}: ${datum.y}%`}
        legendComponent={getLegend(legendData, vmsPerTemplateMap)}
        legendPosition="bottom"
        padding={{
          bottom: 65, // Adjusted to accommodate legend
          left: 20,
          right: 20,
          top: 20,
        }}
        subTitle={t('kubevirt-plugin~VMs')}
        title={t('kubevirt-plugin~{{count}}', { count: vms?.length })}
        width={300}
        themeColor="multi"
      />
    </div>
  );

  return (
    <Card className="kv-running-vms-card--gradient" data-test-id="kv-running-vms-per-template-card">
      <CardHeader>
        <CardTitle>{t('kubevirt-plugin~Running VMs per template')}</CardTitle>
      </CardHeader>
      <CardBody>{chart}</CardBody>
    </Card>
  );
};

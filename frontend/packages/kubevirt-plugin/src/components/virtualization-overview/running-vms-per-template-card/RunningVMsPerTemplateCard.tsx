import * as React from 'react';
import { ChartDonut } from '@patternfly/react-charts';
import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { LABEL_USED_TEMPLATE_NAME } from '../../../constants';
import { useRunningVMsPerTemplateResources } from '../../../hooks/use-running-vms-per-template-resources';
import { getName, getNamespace } from '../../../selectors';
import { VMsChartLegend } from './RunningVMsChartLegend';
import { RunningVMsChartLegendLabelItem } from './RunningVMsChartLegendLabel';
import { getColorList } from './utils';

import './running-vms-per-template-card.scss';

const getTemplateNS = (templateName, templates) => {
  const template = templates.find((temp) => getName(temp) === templateName);
  return template ? getNamespace(template) : null;
};

const getTemplateToVMCountMap = (resources) => {
  const loaded = resources?.loaded;
  const vms = loaded && resources?.vms;
  const templates = loaded && resources?.templates;

  const templateToVMCountMap = new Map();
  const numVMs = vms.length;

  if (loaded) {
    vms.forEach((vm) => {
      const template = vm?.metadata?.labels[LABEL_USED_TEMPLATE_NAME];
      const value = templateToVMCountMap.has(template)
        ? templateToVMCountMap.get(template).vmCount + 1
        : 1;
      templateToVMCountMap.set(template, { vmCount: value });
    });
  }

  const numTemplates = templateToVMCountMap.size;
  const colorListIter = getColorList(numTemplates).values();

  for (const key of templateToVMCountMap.keys()) {
    const templateChartData = templateToVMCountMap.get(key);
    const additionalData = {
      percentage: Math.round((templateChartData.vmCount / numVMs) * 100),
      color: colorListIter.next().value,
      namespace: getTemplateNS(key, templates),
    };
    templateToVMCountMap.set(key, { ...templateChartData, ...additionalData });
  }

  return templateToVMCountMap;
};

const getChartData = (templateToVMCountMap) => {
  const chartData = [];
  templateToVMCountMap.forEach((data, templateName) => {
    chartData.push({
      x: templateName,
      y: data.percentage,
      fill: data.color,
    });
  });
  return chartData;
};

const getLegendItems = (templateToVMCountMap): RunningVMsChartLegendLabelItem[] => {
  const legendItems = [];
  templateToVMCountMap.forEach((data, templateName) => {
    legendItems.push({
      name: templateName,
      vmCount: data.vmCount,
      color: data.color,
      namespace: data.namespace,
    });
  });
  return legendItems;
};

export const RunningVMsPerTemplateCard = () => {
  const { t } = useTranslation();
  const resources = useRunningVMsPerTemplateResources();
  const templateToVMCountMap = React.useMemo(() => getTemplateToVMCountMap(resources), [resources]);

  const chartData = getChartData(templateToVMCountMap);
  const legendItems = getLegendItems(templateToVMCountMap);

  const chart = (
    <div>
      <ChartDonut
        ariaDesc={t('kubevirt-plugin~Running VMs per template')}
        ariaTitle={t('kubevirt-plugin~Running VMs per template donut chart')}
        data={chartData}
        height={150}
        labels={({ datum }) => `${datum.x}: ${datum.y}%`}
        legendPosition="bottom"
        padding={{
          bottom: 20,
          left: 20,
          right: 20,
          top: 20,
        }}
        subTitle={t('kubevirt-plugin~VMs')}
        title={resources?.vms?.length?.toString()}
        width={300}
        style={{
          data: {
            fill: ({ datum }) => datum.fill,
          },
        }}
      />
    </div>
  );

  return (
    <Card className="kv-running-vms-card__gradient" data-test-id="kv-running-vms-per-template-card">
      <CardHeader>
        <CardTitle>{t('kubevirt-plugin~Running VMs per template')}</CardTitle>
      </CardHeader>
      <CardBody>
        {chart}
        <VMsChartLegend legendItems={legendItems} />
      </CardBody>
    </Card>
  );
};

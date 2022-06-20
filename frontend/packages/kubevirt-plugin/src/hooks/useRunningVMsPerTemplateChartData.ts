import { useTranslation } from 'react-i18next';
import { TemplateKind } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared';
import { RunningVMsChartLegendLabelItem } from '../components/virtualization-overview/running-vms-per-template-card/RunningVMsChartLegendLabel';
import { getColorList } from '../components/virtualization-overview/running-vms-per-template-card/utils';
import { getVmStatus } from '../components/virtualization-overview/utils';
import { useVmStatusResources } from '../components/vm-status/use-vm-status-resources';
import { LABEL_USED_TEMPLATE_NAME } from '../constants';
import { VMStatus } from '../constants/vm/vm-status';
import { FLAG_KUBEVIRT_HAS_PRINTABLESTATUS } from '../flags/const';
import { getName, getNamespace } from '../selectors';
import { VMKind } from '../types';
import { useRunningVMsPerTemplateResources } from './use-running-vms-per-template-resources';

const getTemplateNS = (templateName, templates) => {
  const template = templates.find((temp) => getName(temp) === templateName);
  return template ? getNamespace(template) : null;
};

const getTemplateToVMCountMap = (loaded, runningVMs, templates, t) => {
  const templateToVMCountMap = new Map();
  const numVMs = runningVMs?.length || 0;

  if (loaded) {
    runningVMs.forEach((vm) => {
      const labels = vm?.metadata?.labels;
      const template = labels?.[LABEL_USED_TEMPLATE_NAME] || t('kubevirt-plugin~Other');
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
      percentage: numVMs ? Math.round((templateChartData.vmCount / numVMs) * 100) : 0,
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

export const useRunningVMsPerTemplateChartData = (): [any[], any[], number] => {
  const { t } = useTranslation();
  const resources = useRunningVMsPerTemplateResources();
  const printableStatusAvailable = useFlag(FLAG_KUBEVIRT_HAS_PRINTABLESTATUS);
  const statusResources = useVmStatusResources(undefined);

  const loaded = resources?.loaded;
  const vms: VMKind[] = loaded ? resources?.vms : [];
  const templates: TemplateKind[] = loaded ? resources?.templates : [];

  const runningVMs = vms?.filter(
    (vm) => getVmStatus(vm, statusResources, printableStatusAvailable) === VMStatus.RUNNING,
  );

  const templateToVMCountMap = getTemplateToVMCountMap(loaded, runningVMs, templates, t);

  const chartData = getChartData(templateToVMCountMap);
  const legendItems = getLegendItems(templateToVMCountMap);
  const numRunningVMs = runningVMs?.length || 0;

  return [chartData, legendItems, numRunningVMs];
};

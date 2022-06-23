import { convertToBaseValue, humanizePercentage } from '@console/internal/components/utils';

const genericCountResources = [
  'configmaps',
  'persistentvolumeclaims',
  'pods',
  'replicationcontrollers',
  'resourcequotas',
  'services',
  'services.loadbalancers',
  'services.nodeports',
  'secrets',
  'openshift.io/imagestreams',
];

export const getUsedPercentage = (hard: string, used: string) => {
  let usedNum = convertToBaseValue(used);
  let hardNum = convertToBaseValue(hard);

  if (!usedNum || !hardNum) {
    // try to get the value without unit
    usedNum = parseInt(usedNum, 10);
    hardNum = parseInt(hardNum, 10);
  }

  return !usedNum || !hardNum ? 0 : (usedNum / hardNum) * 100;
};

export const getLabelAndUsage = ({
  resourceName,
  used,
  hard,
}: {
  resourceName: string;
  used: string;
  hard: string;
}) => {
  const useCount =
    resourceName.startsWith('count/') || genericCountResources.includes(resourceName);

  const percent = getUsedPercentage(hard, used);

  return {
    label: useCount ? `${used || 0} of ${hard}` : humanizePercentage(percent).string,
    percent,
  };
};

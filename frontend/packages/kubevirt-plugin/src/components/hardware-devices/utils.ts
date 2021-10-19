import { TFunction } from 'i18next';
import { dimensifyHeader } from '../../utils';

export const tableColumnClasses = ['', ''];

export const HWDHeader = (t: TFunction) => () =>
  dimensifyHeader(
    [
      {
        title: t('kubevirt-plugin~Resource name'),
      },
      {
        title: t('kubevirt-plugin~Quantity'),
      },
    ],
    tableColumnClasses,
  );

export const deviceCounts = (devices: any[]) => {
  const counts = {};
  devices?.forEach((device) => {
    counts[device.resourceName] = counts[device.resourceName] + 1 || 1;
  });
  return counts;
};

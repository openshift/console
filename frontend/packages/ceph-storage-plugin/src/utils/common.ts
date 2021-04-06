import { TFunction } from 'i18next';
import { StorageClusterKind } from '../types';

export const checkArbiterCluster = (storageCluster: StorageClusterKind): boolean =>
  storageCluster?.spec?.arbiter?.enable;

export const checkFlexibleScaling = (storageCluster: StorageClusterKind): boolean =>
  storageCluster?.spec?.flexibleScaling;

export const commaSeparatedString = (text: string[], t: TFunction): string =>
  [text.slice(0, -1).join(', '), text.slice(-1)[0]].join(
    text.length < 2 ? '' : ` ${t('ceph-storage-plugin~and')} `,
  );

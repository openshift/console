import { StorageClusterKind } from '../types';

export const checkArbiterCluster = (storageCluster: StorageClusterKind): boolean =>
  storageCluster?.spec?.arbiter?.enable;

export const checkFlexibleScaling = (storageCluster: StorageClusterKind): boolean =>
  storageCluster?.spec?.flexibleScaling;

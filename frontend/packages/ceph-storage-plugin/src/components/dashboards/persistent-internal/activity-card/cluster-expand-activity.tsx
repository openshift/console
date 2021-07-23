import * as React from 'react';
import { useTranslation } from 'react-i18next';
import ActivityItem from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const ClusterExpandActivity: React.FC = () => {
  const { t } = useTranslation();

  return <ActivityItem>{t('ceph-storage-plugin~Expanding StorageCluster')}</ActivityItem>;
};

export const isClusterExpandActivity = (storageCluster: K8sResourceKind): boolean =>
  storageCluster?.status?.phase === 'Expanding';

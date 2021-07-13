import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WatchK8sResults } from '@console/internal/components/utils/k8s-watch-hook';
import {
  HealthState,
  healthStateMapping,
  healthStateMessage,
} from '@console/shared/src/components/dashboard/status-card/states';
import Status, {
  StatusPopupSection,
} from '@console/shared/src/components/dashboard/status-card/StatusPopup';
import { getCephHealthState } from './dashboards/persistent-internal/status-card/utils';
import { WatchCephResource } from '../types';

export const StoragePopover: React.FC<StoragePopoverProps> = ({ ceph }) => {
  const { t } = useTranslation();

  const health = getCephHealthState({ ceph }, t);
  const icon =
    health.state === HealthState.LOADING ? (
      <div className="skeleton-health" />
    ) : (
      healthStateMapping[health.state].icon
    );
  const value = health.message || healthStateMessage(health.state, t);

  return (
    <>
      {t(
        "ceph-storage-plugin~Storage status represents the health status of Openshift Container Storage's StorageCluster.",
      )}
      <StatusPopupSection
        firstColumn={t('ceph-storage-plugin~Provider')}
        secondColumn={t('ceph-storage-plugin~Health')}
      >
        <Status key="ocs" value={value} icon={icon}>
          <Link to="/ocs-dashboards">{t('ceph-storage-plugin~Openshift Container Storage')}</Link>
        </Status>
      </StatusPopupSection>
    </>
  );
};

type StoragePopoverProps = WatchK8sResults<WatchCephResource>;

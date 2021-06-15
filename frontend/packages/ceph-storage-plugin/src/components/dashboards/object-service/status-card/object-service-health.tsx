import * as React from 'react';
import { useTranslation } from 'react-i18next';
import Status, {
  StatusPopupSection,
} from '@console/shared/src/components/dashboard/status-card/StatusPopup';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import {
  healthStateMapping,
  HealthState,
} from '@console/shared/src/components/dashboard/status-card/states';
import { SubsystemHealth } from '@console/plugin-sdk';
import { getWorstStatus } from '@console/app/src/components/dashboards-page/status';
import { StatusType } from '../../../../constants';

type ObjectServiceStatusProps = {
  RGWMetrics: SubsystemHealth;
  MCGMetrics: SubsystemHealth;
  statusType: StatusType;
};

export const ObjectServiceStatus: React.FC<ObjectServiceStatusProps> = ({
  RGWMetrics,
  MCGMetrics,
  statusType,
}) => {
  const { t } = useTranslation();

  const isMissing = !(RGWMetrics && MCGMetrics);
  const title =
    statusType === StatusType.HEALTH
      ? t('ceph-storage-plugin~Object Service')
      : t('ceph-storage-plugin~Data Resiliency');
  const popupTitle =
    statusType === StatusType.HEALTH
      ? t('ceph-storage-plugin~Object Service Status')
      : t('ceph-storage-plugin~Data Resiliency');
  const { state = HealthState.LOADING, message = '' } = !isMissing
    ? getWorstStatus([RGWMetrics, MCGMetrics], t)
    : {};
  return isMissing ? (
    <HealthItem
      title={title}
      state={RGWMetrics?.state || MCGMetrics?.state}
      details={RGWMetrics?.message || MCGMetrics?.message}
    />
  ) : (
    <HealthItem title={title} state={state} details={message} popupTitle={popupTitle}>
      {statusType === StatusType.HEALTH
        ? t('ceph-storage-plugin~The object service includes 2 services.')
        : t('ceph-storage-plugin~The data resiliency includes 2 services')}
      <StatusPopupSection
        firstColumn={t('ceph-storage-plugin~Services')}
        secondColumn={t('ceph-storage-plugin~Status')}
      >
        <Status icon={healthStateMapping[MCGMetrics.state]?.icon}>
          {t('ceph-storage-plugin~Multicloud Object Gateway')}
        </Status>
        <Status icon={healthStateMapping[RGWMetrics.state]?.icon}>
          {t('ceph-storage-plugin~Object Gateway (RGW)')}
        </Status>
      </StatusPopupSection>
    </HealthItem>
  );
};

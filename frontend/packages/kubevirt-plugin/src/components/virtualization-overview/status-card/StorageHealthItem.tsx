import * as React from 'react';
import { useTranslation } from 'react-i18next';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { useKubevirtStorageOperatorCSVs } from '../../../hooks/use-kubevirt-storage-operator-csvs';
import { StatusCardStoragePopover } from './StatusCardStoragePopover';
import { getOverallStorageStatus, getStorageOperatorHealthStatus } from './utils';

export const StorageHealthItem = () => {
  const { t } = useTranslation();
  const { lsoCSV, odfCSV, loaded, loadError } = useKubevirtStorageOperatorCSVs();

  const lsoState = getStorageOperatorHealthStatus(lsoCSV, loaded, loadError, t);
  const odfState = getStorageOperatorHealthStatus(odfCSV, loaded, loadError, t);
  const status = getOverallStorageStatus(lsoState, odfState, loaded, loadError);

  return (
    <HealthItem
      title={t('kubevirt-plugin~Storage')}
      state={status.state}
      details={''}
      popupTitle={t('kubevirt-plugin~Storage requirements')}
    >
      <StatusCardStoragePopover lsoState={lsoState} odfState={odfState} />
    </HealthItem>
  );
};

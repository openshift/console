import { TFunction } from 'i18next';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { ClusterServiceVersionPhase } from './constants';

const getHealthStatusFromCSV = (csv: ClusterServiceVersionKind, t: TFunction) => {
  const csvStatus = csv?.status?.phase;
  switch (csvStatus) {
    case ClusterServiceVersionPhase.CSVPhaseSucceeded:
      return {
        state: HealthState.OK,
        message: t('kubevirt-plugin~Available'),
      };
    case ClusterServiceVersionPhase.CSVPhaseFailed:
      return {
        state: HealthState.ERROR,
        message: t('kubevirt-plugin~Error'),
      };
    default:
      return {
        state: HealthState.NOT_AVAILABLE,
        message: t('kubevirt-plugin~Not available'),
      };
  }
};

export const getStorageOperatorHealthStatus = (operatorCSV, loaded, loadError, t) => {
  if (!loaded) {
    return { state: HealthState.LOADING };
  }
  if (loadError || !operatorCSV) {
    return { state: HealthState.NOT_AVAILABLE, message: t('kubevirt-plugin~Not available') };
  }
  return getHealthStatusFromCSV(operatorCSV, t);
};

export const getOverallStorageStatus = (lsoState, odfState, loaded, loadError) => {
  const lsoAvailable = lsoState.state === HealthState.OK;
  const odfAvailable = odfState.state === HealthState.OK;

  if (!loaded) {
    return { state: HealthState.LOADING };
  }
  if (loadError) {
    return { state: HealthState.ERROR };
  }
  if (lsoAvailable || odfAvailable) {
    return { state: HealthState.OK };
  }
  return { state: HealthState.NOT_AVAILABLE };
};

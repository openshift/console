import { TFunction } from 'i18next';
import { toInteger } from 'lodash';
import {
  HealthState,
  PrometheusHealthPopupProps,
  PrometheusResult,
  PrometheusValue,
  SubsystemHealth,
} from '@console/dynamic-plugin-sdk';
import { ConfigMap } from '../resources';

const getPrometheusMetricValue = (
  prometheusResult: PrometheusResult[],
  reason: string,
): PrometheusValue | undefined => prometheusResult.find((r) => r.metric.reason === reason)?.value;

export const getVSphereHealth = (
  t: TFunction,
  responses: PrometheusHealthPopupProps['responses'],
  configMapResult: PrometheusHealthPopupProps['k8sResult'],
): SubsystemHealth => {
  if (!configMapResult) {
    return { state: HealthState.LOADING };
  }

  if (configMapResult.loadError) {
    // This should not happen if the vSphere FLAG is true
    return {
      state: HealthState.WARNING,
      message: t('vsphere-plugin~Missing the vSphere config map.'),
    };
  }

  if (!configMapResult.loaded) {
    return { state: HealthState.LOADING };
  }

  const cloudProviderConfig = configMapResult.data as ConfigMap | undefined;
  if (!cloudProviderConfig) {
    return {
      state: HealthState.WARNING,
      message: t('vsphere-plugin~Not configured yet'),
    };
  }

  // by vSphere Problem Detector
  if (responses.length < 1) {
    return { state: HealthState.LOADING };
  }

  if (responses.find((r) => r.error)) {
    return { state: HealthState.ERROR, message: t('vsphere-plugin~Prometheus query failed.') };
  }

  if (!responses[0].response?.status) {
    return { state: HealthState.LOADING };
  }

  const prometheusResult = responses[0].response?.data?.result;
  if (responses[0].response.status !== 'success' || !prometheusResult) {
    return { state: HealthState.ERROR, message: t('vsphere-plugin~Prometheus query failed.') };
  }

  const invCreds = getPrometheusMetricValue(prometheusResult, 'InvalidCredentials');

  if (invCreds?.[0] && toInteger(invCreds?.[1]) > 0) {
    // TODO: Add timestamp to the message but where to get it from?? It's not invCreds[0]

    return { state: HealthState.WARNING, message: t('vsphere-plugin~Invalid credentials') };
  }

  const syncErr = getPrometheusMetricValue(prometheusResult, 'SyncError');
  if (toInteger(syncErr?.[1])) {
    // TODO: Add timestamp to the message
    return { state: HealthState.WARNING, message: 'vsphere-plugin~Synchronization failed' };
  }

  const anyFailingMetric = prometheusResult.find((r) => toInteger(r.value?.[1]) > 0);
  if (anyFailingMetric) {
    // TODO: Add timestamp to the message
    return {
      state: HealthState.WARNING,
      message: t('vsphere-plugin~Failing {{reason}}', { reason: anyFailingMetric.metric.reason }),
    };
  }

  return {
    state:
      HealthState.PROGRESS /* To be changed. Since the Problem detector is unreliable, we can not be sure about the result so showing Progress instead and instructing the user to take actions to verify. */,
  };
};

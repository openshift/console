import type { K8sKind, K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';

const OLSConfigModel: K8sKind = {
  apiGroup: 'ols.openshift.io',
  apiVersion: 'v1alpha1',
  label: 'OLSConfig',
  // t('console-shared~OLSConfig')
  labelKey: 'console-shared~OLSConfig',
  // t('console-shared~OLSConfigs')
  labelPluralKey: 'console-shared~OLSConfigs',
  plural: 'olsconfigs',
  abbr: 'OLSC',
  namespaced: false,
  kind: 'OLSConfig',
  id: 'olsconfig',
  labelPlural: 'OLSConfigs',
  crd: true,
};

const OLSCONFIG_INSTANCE = 'cluster';

export const useOLSConfig = (): boolean => {
  const [, loaded, err] = useK8sGet<K8sResourceKind>(OLSConfigModel, OLSCONFIG_INSTANCE);
  return loaded && !err;
};

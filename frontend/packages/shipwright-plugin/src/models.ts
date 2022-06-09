import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { API_GROUP, API_VERSION } from './const';

export const ClusterBuildStrategyModel: K8sModel = {
  id: 'clusterbuildstrategy',
  plural: 'clusterbuildstrategies',
  apiGroup: API_GROUP,
  apiVersion: API_VERSION,
  kind: 'ClusterBuildStrategy',
  namespaced: false,
  crd: true,

  label: 'ClusterBuildStrategy',
  // t('shipwright-plugin~ClusterBuildStrategy')
  labelKey: 'knative-plugin~ClusterBuildStrategy',
  labelPlural: 'ClusterBuildStrategies',
  // t('shipwright-plugin~ClusterBuildStrategies')
  labelPluralKey: 'knative-plugin~ClusterBuildStrategies',
  abbr: 'CBS',
};

export const BuildStrategyModel: K8sModel = {
  id: 'buildstrategy',
  plural: 'buildstrategies',
  apiGroup: API_GROUP,
  apiVersion: API_VERSION,
  kind: 'BuildStrategy',
  namespaced: true,
  crd: true,

  label: 'BuildStrategy',
  // t('shipwright-plugin~BuildStrategy')
  labelKey: 'knative-plugin~BuildStrategy',
  labelPlural: 'BuildStrategies',
  // t('shipwright-plugin~BuildStrategies')
  labelPluralKey: 'knative-plugin~BuildStrategies',
  abbr: 'BS',
};

export const BuildModel: K8sModel = {
  id: 'build',
  plural: 'builds',
  apiGroup: API_GROUP,
  apiVersion: API_VERSION,
  kind: 'Build',
  namespaced: true,
  crd: true,

  label: 'Build',
  // t('shipwright-plugin~Build')
  labelKey: 'knative-plugin~Build',
  labelPlural: 'Builds',
  // t('shipwright-plugin~Builds')
  labelPluralKey: 'knative-plugin~Builds',
  abbr: 'B',
};

export const BuildRunModel: K8sModel = {
  id: 'buildrun',
  plural: 'buildruns',
  apiGroup: API_GROUP,
  apiVersion: API_VERSION,
  kind: 'BuildRun',
  namespaced: true,
  crd: true,

  label: 'BuildRun',
  // t('shipwright-plugin~BuildRun')
  labelKey: 'knative-plugin~BuildRun',
  labelPlural: 'BuildRuns',
  // t('shipwright-plugin~BuildRuns')
  labelPluralKey: 'knative-plugin~BuildRuns',
  abbr: 'BR',
};

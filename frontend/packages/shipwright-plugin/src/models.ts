import { chart_color_green_400 as tektonGroupColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';
import type { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { API_GROUP, API_VERSION_LATEST } from './const';

export const ClusterBuildStrategyModelV1Alpha1: K8sModel = {
  id: 'clusterbuildstrategy',
  plural: 'clusterbuildstrategies',
  apiGroup: API_GROUP,
  apiVersion: 'v1alpha1',
  kind: 'ClusterBuildStrategy',
  namespaced: false,
  crd: true,

  label: 'ClusterBuildStrategy',
  // t('shipwright-plugin~ClusterBuildStrategy')
  labelKey: 'shipwright-plugin~ClusterBuildStrategy',
  labelPlural: 'ClusterBuildStrategies',
  // t('shipwright-plugin~ClusterBuildStrategies')
  labelPluralKey: 'shipwright-plugin~ClusterBuildStrategies',
  abbr: 'CBS',
};

export const BuildStrategyModelV1Alpha1: K8sModel = {
  id: 'buildstrategy',
  plural: 'buildstrategies',
  apiGroup: API_GROUP,
  apiVersion: 'v1alpha1',
  kind: 'BuildStrategy',
  namespaced: true,
  crd: true,

  label: 'BuildStrategy',
  // t('shipwright-plugin~BuildStrategy')
  labelKey: 'shipwright-plugin~BuildStrategy',
  labelPlural: 'BuildStrategies',
  // t('shipwright-plugin~BuildStrategies')
  labelPluralKey: 'shipwright-plugin~BuildStrategies',
  abbr: 'BS',
};

export const BuildModelV1Alpha1: K8sModel = {
  id: 'build',
  plural: 'builds',
  apiGroup: API_GROUP,
  apiVersion: 'v1alpha1',
  kind: 'Build',
  namespaced: true,
  crd: true,

  label: 'Build',
  // t('shipwright-plugin~Build')
  labelKey: 'shipwright-plugin~Build',
  labelPlural: 'Builds',
  // t('shipwright-plugin~Builds')
  labelPluralKey: 'shipwright-plugin~Builds',
  abbr: 'B',
};

export const BuildRunModelV1Alpha1: K8sModel = {
  id: 'buildrun',
  plural: 'buildruns',
  apiGroup: API_GROUP,
  apiVersion: 'v1alpha1',
  kind: 'BuildRun',
  namespaced: true,
  crd: true,

  label: 'BuildRun',
  // t('shipwright-plugin~BuildRun')
  labelKey: 'shipwright-plugin~BuildRun',
  labelPlural: 'BuildRuns',
  // t('shipwright-plugin~BuildRuns')
  labelPluralKey: 'shipwright-plugin~BuildRuns',
  abbr: 'BR',
};

export const ClusterBuildStrategyModel: K8sModel = {
  id: 'clusterbuildstrategy',
  plural: 'clusterbuildstrategies',
  apiGroup: API_GROUP,
  apiVersion: API_VERSION_LATEST,
  kind: 'ClusterBuildStrategy',
  namespaced: false,
  crd: true,

  label: 'ClusterBuildStrategy',
  // t('shipwright-plugin~ClusterBuildStrategy')
  labelKey: 'shipwright-plugin~ClusterBuildStrategy',
  labelPlural: 'ClusterBuildStrategies',
  // t('shipwright-plugin~ClusterBuildStrategies')
  labelPluralKey: 'shipwright-plugin~ClusterBuildStrategies',
  abbr: 'CBS',
};

export const BuildStrategyModel: K8sModel = {
  id: 'buildstrategy',
  plural: 'buildstrategies',
  apiGroup: API_GROUP,
  apiVersion: API_VERSION_LATEST,
  kind: 'BuildStrategy',
  namespaced: true,
  crd: true,

  label: 'BuildStrategy',
  // t('shipwright-plugin~BuildStrategy')
  labelKey: 'shipwright-plugin~BuildStrategy',
  labelPlural: 'BuildStrategies',
  // t('shipwright-plugin~BuildStrategies')
  labelPluralKey: 'shipwright-plugin~BuildStrategies',
  abbr: 'BS',
};

export const BuildModel: K8sModel = {
  id: 'build',
  plural: 'builds',
  apiGroup: API_GROUP,
  apiVersion: API_VERSION_LATEST,
  kind: 'Build',
  namespaced: true,
  crd: true,

  label: 'Build',
  // t('shipwright-plugin~Build')
  labelKey: 'shipwright-plugin~Build',
  labelPlural: 'Builds',
  // t('shipwright-plugin~Builds')
  labelPluralKey: 'shipwright-plugin~Builds',
  abbr: 'B',
};

export const BuildRunModel: K8sModel = {
  id: 'buildrun',
  plural: 'buildruns',
  apiGroup: API_GROUP,
  apiVersion: API_VERSION_LATEST,
  kind: 'BuildRun',
  namespaced: true,
  crd: true,

  label: 'BuildRun',
  // t('shipwright-plugin~BuildRun')
  labelKey: 'shipwright-plugin~BuildRun',
  labelPlural: 'BuildRuns',
  // t('shipwright-plugin~BuildRuns')
  labelPluralKey: 'shipwright-plugin~BuildRuns',
  abbr: 'BR',
};

export const TaskRunModel: K8sModel = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  label: 'TaskRun',
  // t('shipwright-plugin~TaskRun')
  labelKey: 'shipwright-plugin~TaskRun',
  // t('shipwright-plugin~TaskRuns')
  labelPluralKey: 'shipwright-plugin~TaskRuns',
  plural: 'taskruns',
  abbr: 'TR',
  namespaced: true,
  kind: 'TaskRun',
  id: 'taskrun',
  labelPlural: 'TaskRuns',
  crd: true,
  color: tektonGroupColor.value,
};

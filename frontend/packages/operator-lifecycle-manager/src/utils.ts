import * as _ from 'lodash';
import { K8sResourceKind, ObjectMetadata, Patch } from '@console/internal/module/k8s';
import { parseJSONAnnotation } from '@console/shared/src/utils/annotations';
import { INTERNAL_OBJECTS_ANNOTATION, OPERATOR_PLUGINS_ANNOTATION } from './const';
import { SubscriptionKind, SubscriptionState } from './types';

export const getClusterServiceVersionPlugins = (
  annotations: ObjectMetadata['annotations'],
): string[] => parseJSONAnnotation(annotations, OPERATOR_PLUGINS_ANNOTATION) ?? [];

export const getInternalObjects = (annotations: ObjectMetadata['annotations']): string[] =>
  parseJSONAnnotation(annotations, INTERNAL_OBJECTS_ANNOTATION) ?? [];

export const getPluginPatch = (
  console: K8sResourceKind,
  plugin: string,
  enabled: boolean,
): Patch => {
  if (!enabled) {
    return {
      path: '/spec/plugins',
      value: console.spec.plugins.filter((p: string) => p !== plugin),
      op: 'replace',
    };
  }

  // Create the array if it doesn't exist. Append to the array otherwise.
  return _.isEmpty(console.spec.plugins)
    ? {
        path: '/spec/plugins',
        value: [plugin],
        op: 'add',
      }
    : {
        path: '/spec/plugins/-',
        value: plugin,
        op: 'add',
      };
};

export const isCatalogSourceTrusted = (catalogSource: string): boolean =>
  catalogSource === 'redhat-operators';

export const isPluginEnabled = (console: K8sResourceKind, plugin: string): boolean =>
  !!console?.spec?.plugins?.includes(plugin);

export const upgradeRequiresApproval = (subscription: SubscriptionKind): boolean =>
  subscription?.status?.state === SubscriptionState.SubscriptionStateUpgradePending &&
  (subscription.status?.conditions ?? []).filter(
    ({ status, reason }) => status === 'True' && reason === 'RequiresApproval',
  ).length > 0;

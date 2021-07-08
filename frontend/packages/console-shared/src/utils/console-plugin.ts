import * as _ from 'lodash';
import { K8sResourceKind, Patch } from '@console/internal/module/k8s';

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

export const isPluginEnabled = (console: K8sResourceKind, plugin: string): boolean =>
  !!console?.spec?.plugins?.includes(plugin);

import type { SubsystemHealth } from '@console/dynamic-plugin-sdk';
import { HealthState } from '@console/dynamic-plugin-sdk';
import { pluginStore } from '@console/internal/plugins';

export const getDynamicPluginHealthState = (): SubsystemHealth => {
  const dynamicPluginInfo = pluginStore.getPluginInfo();
  if (dynamicPluginInfo.some((plugin) => plugin.status === 'failed')) {
    return { state: HealthState.ERROR };
  }
  if (dynamicPluginInfo.some((plugin) => plugin.status === 'pending')) {
    return { state: HealthState.PROGRESS };
  }
  if (dynamicPluginInfo.every((plugin) => plugin.status === 'loaded')) {
    return { state: HealthState.OK };
  }
  return { state: HealthState.UNKNOWN };
};

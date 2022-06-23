import { HealthState, SubsystemHealth } from '@console/dynamic-plugin-sdk';
import { pluginStore } from '@console/internal/plugins';

export const getDynamicPluginHealthState = (): SubsystemHealth => {
  const dynamicPluginInfo = pluginStore.getDynamicPluginInfo();
  if (dynamicPluginInfo.some((plugin) => plugin.status === 'Failed')) {
    return { state: HealthState.ERROR };
  }
  if (dynamicPluginInfo.some((plugin) => plugin.status === 'Pending')) {
    return { state: HealthState.PROGRESS };
  }
  if (dynamicPluginInfo.every((plugin) => plugin.status === 'Loaded')) {
    return { state: HealthState.OK };
  }
  return { state: HealthState.UNKNOWN };
};

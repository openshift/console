import * as React from 'react';
import { DASH } from '@console/dynamic-plugin-sdk/src/app/constants';
import { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { isLoadedDynamicPluginInfo } from '@console/plugin-sdk/src';
import { usePluginStore } from '@console/plugin-sdk/src/api/usePluginStore';
import {
  ConsolePluginEnabledStatus,
  developmentMode,
  useConsoleOperatorConfigData,
} from './ConsoleOperatorConfig';

const ConsolePluginEnabledStatusDetail: React.FC<DetailsItemComponentProps> = ({ obj }) => {
  const pluginStore = usePluginStore();
  const { consoleOperatorConfig, consoleOperatorConfigLoaded } = useConsoleOperatorConfigData();

  const pluginName = React.useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);

  const pluginInfo = React.useMemo(() => pluginStore.findDynamicPluginInfo(pluginName), [
    pluginStore,
    pluginName,
  ]);
  const enabledPlugins = React.useMemo<string[]>(() => consoleOperatorConfig?.spec?.plugins ?? [], [
    consoleOperatorConfig?.spec?.plugins,
  ]);

  return consoleOperatorConfigLoaded ? (
    <ConsolePluginEnabledStatus
      pluginName={pluginName}
      enabled={
        developmentMode
          ? (isLoadedDynamicPluginInfo(pluginInfo) && pluginInfo.enabled) ?? false
          : enabledPlugins.includes(pluginName) ?? false
      }
    />
  ) : (
    <>{DASH}</>
  );
};

export default ConsolePluginEnabledStatusDetail;

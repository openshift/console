import * as React from 'react';
import { DASH } from '@console/dynamic-plugin-sdk/src/app/constants';
import { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { isLoadedDynamicPluginInfo } from '@console/plugin-sdk/src';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import {
  ConsolePluginEnabledStatus,
  developmentMode,
  useConsoleOperatorConfigData,
} from './ConsoleOperatorConfig';

const ConsolePluginEnabledStatusDetail: React.FC<DetailsItemComponentProps> = ({ obj }) => {
  const [pluginInfoEntries] = usePluginInfo();
  const { consoleOperatorConfig, consoleOperatorConfigLoaded } = useConsoleOperatorConfigData();

  const pluginName = React.useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);

  const pluginInfo = React.useMemo(
    () =>
      pluginInfoEntries.find((entry) =>
        isLoadedDynamicPluginInfo(entry)
          ? entry.metadata.name === pluginName
          : entry.pluginName === pluginName,
      ),
    [pluginInfoEntries, pluginName],
  );
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

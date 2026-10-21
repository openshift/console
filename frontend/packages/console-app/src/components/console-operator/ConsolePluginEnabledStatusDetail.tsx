import type { FC } from 'react';
import { useMemo } from 'react';
import { DASH } from '@console/dynamic-plugin-sdk/src/app/constants';
import type { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import {
  ConsolePluginEnabledStatus,
  developmentMode,
  useConsoleOperatorConfigData,
} from './ConsoleOperatorConfig';

const ConsolePluginEnabledStatusDetail: FC<DetailsItemComponentProps> = ({ obj }) => {
  const pluginInfoEntries = usePluginInfo();
  const { consoleOperatorConfig, consoleOperatorConfigLoaded } = useConsoleOperatorConfigData();

  const pluginName = useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);

  const pluginInfo = useMemo(
    () => pluginInfoEntries.find((entry) => entry.manifest.name === pluginName),
    [pluginInfoEntries, pluginName],
  );
  const enabledPlugins = useMemo<string[]>(() => consoleOperatorConfig?.spec?.plugins ?? [], [
    consoleOperatorConfig?.spec?.plugins,
  ]);

  return consoleOperatorConfigLoaded && pluginName ? (
    <ConsolePluginEnabledStatus
      pluginName={pluginName}
      enabled={
        developmentMode
          ? (pluginInfo?.status === 'loaded' && pluginInfo.enabled) ?? false
          : enabledPlugins.includes(pluginName) ?? false
      }
    />
  ) : (
    <>{DASH}</>
  );
};

export default ConsolePluginEnabledStatusDetail;

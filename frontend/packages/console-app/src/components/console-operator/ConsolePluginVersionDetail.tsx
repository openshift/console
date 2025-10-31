import * as React from 'react';
import { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { isLoadedDynamicPluginInfo } from '@console/plugin-sdk/src';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import { DASH } from '@console/shared/src/constants';

const ConsolePluginVersionDetail: React.FC<DetailsItemComponentProps> = ({ obj }) => {
  const [pluginInfoEntries] = usePluginInfo();

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

  return isLoadedDynamicPluginInfo(pluginInfo) ? <>{pluginInfo.metadata.version}</> : <>{DASH}</>;
};

export default ConsolePluginVersionDetail;

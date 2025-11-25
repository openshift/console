import type { FC } from 'react';
import { useMemo } from 'react';
import type { ConsoleSupportedCustomProperties } from '@console/dynamic-plugin-sdk/src/build-types';
import { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import { DASH } from '@console/shared/src/constants';

const ConsolePluginDescriptionDetail: FC<DetailsItemComponentProps> = ({ obj }) => {
  const pluginName = useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);

  const pluginInfoEntries = usePluginInfo();
  const pluginInfo = useMemo(
    () => pluginInfoEntries.find((entry) => entry.manifest.name === pluginName),
    [pluginInfoEntries, pluginName],
  );

  return pluginInfo?.status === 'loaded' ? (
    <>
      {(pluginInfo.manifest.customProperties?.console as ConsoleSupportedCustomProperties)
        ?.description || DASH}
    </>
  ) : (
    <>{DASH}</>
  );
};

export default ConsolePluginDescriptionDetail;

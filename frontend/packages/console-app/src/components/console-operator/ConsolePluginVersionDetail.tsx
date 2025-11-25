import type { FC } from 'react';
import { useMemo } from 'react';
import { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import { DASH } from '@console/shared/src/constants';

const ConsolePluginVersionDetail: FC<DetailsItemComponentProps> = ({ obj }) => {
  const pluginInfoEntries = usePluginInfo();

  const pluginName = useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);

  const pluginInfo = useMemo(
    () => pluginInfoEntries.find((entry) => entry.manifest.name === pluginName),
    [pluginInfoEntries, pluginName],
  );

  return <>{pluginInfo?.manifest.version ?? DASH}</>;
};

export default ConsolePluginVersionDetail;

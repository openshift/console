import type { FC } from 'react';
import { useMemo } from 'react';
import { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import { DASH } from '@console/shared/src/constants';
import { ConsolePluginStatus } from './ConsoleOperatorConfig';

const ConsolePluginStatusDetail: FC<DetailsItemComponentProps> = ({ obj }) => {
  const pluginInfoEntries = usePluginInfo();
  const pluginName = useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);

  const pluginInfo = useMemo(
    () => pluginInfoEntries.find((entry) => entry.manifest.name === pluginName),
    [pluginInfoEntries, pluginName],
  );

  return pluginInfo ? (
    <ConsolePluginStatus
      status={pluginInfo.status}
      errorMessage={pluginInfo.status === 'failed' ? pluginInfo.errorMessage : undefined}
    />
  ) : (
    <>{DASH}</>
  );
};

export default ConsolePluginStatusDetail;

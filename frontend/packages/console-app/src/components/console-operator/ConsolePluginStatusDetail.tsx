import * as React from 'react';
import { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { usePluginStore } from '@console/plugin-sdk/src/api/usePluginStore';
import { DASH } from '@console/shared/src/constants';
import { ConsolePluginStatus } from './ConsoleOperatorConfig';

const ConsolePluginStatusDetail: React.FC<DetailsItemComponentProps> = ({ obj }) => {
  const pluginStore = usePluginStore();
  const pluginName = React.useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);

  const pluginInfo = React.useMemo(() => pluginStore.findDynamicPluginInfo(pluginName), [
    pluginStore,
    pluginName,
  ]);

  return pluginInfo ? (
    <ConsolePluginStatus
      status={pluginInfo.status}
      errorMessage={pluginInfo.status === 'Failed' ? pluginInfo.errorMessage : undefined}
    />
  ) : (
    <>{DASH}</>
  );
};

export default ConsolePluginStatusDetail;

import * as React from 'react';
import { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { isLoadedDynamicPluginInfo } from '@console/plugin-sdk/src';
import { usePluginStore } from '@console/plugin-sdk/src/api/usePluginStore';
import { DASH } from '@console/shared/src/constants';
import { ConsolePluginCSPStatus } from './ConsoleOperatorConfig';

const ConsolePluginCSPStatusDetail: React.FC<DetailsItemComponentProps> = ({ obj }) => {
  const pluginStore = usePluginStore();
  const pluginName = React.useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);

  const pluginInfo = React.useMemo(() => pluginStore.findDynamicPluginInfo(pluginName), [
    pluginStore,
    pluginName,
  ]);

  return pluginInfo ? (
    <ConsolePluginCSPStatus
      hasViolations={
        isLoadedDynamicPluginInfo(pluginInfo) ? pluginInfo.hasCSPViolations ?? false : false
      }
    />
  ) : (
    <>{DASH}</>
  );
};

export default ConsolePluginCSPStatusDetail;

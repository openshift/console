import { useMemo } from 'react';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import { useFlag } from '@console/shared/src/hooks/useFlag';

export const useIsKubevirtPluginActive = () => {
  const kubevirtFeature = useFlag('KUBEVIRT_DYNAMIC');
  const pluginInfoEntries = usePluginInfo();

  const kubevirtPluginLoaded = useMemo(
    () =>
      pluginInfoEntries.find((entry) => entry.manifest.name === 'kubevirt-plugin')?.status ===
      'loaded',
    [pluginInfoEntries],
  );

  return kubevirtFeature && kubevirtPluginLoaded;
};

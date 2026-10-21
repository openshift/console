import type { FC } from 'react';
import { useMemo } from 'react';
import type { GraphElement } from '@patternfly/react-topology';
import type {
  NetworkAdapter,
  K8sResourceCommon,
  DetailsTabSectionExtensionHook,
} from '@console/dynamic-plugin-sdk';
import { isNetworkAdapter, useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import TopologySideBarTabSection from '../side-bar/TopologySideBarTabSection';
import { NetworkingOverview } from './NetworkingOverview';
import { getDataFromAdapter } from './utils';

const NetworkTabSection: FC<{
  networkAdapter: {
    resource: K8sResourceCommon;
  };
}> = ({ networkAdapter }) => {
  return networkAdapter ? (
    <TopologySideBarTabSection>
      <NetworkingOverview obj={networkAdapter.resource} />
    </TopologySideBarTabSection>
  ) : null;
};

export const useNetworkingSideBarTabSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  const [networkAdapterExtensions, extensionsLoaded] = useResolvedExtensions<NetworkAdapter>(
    isNetworkAdapter,
  );
  const networkAdapter = useMemo(
    () =>
      getDataFromAdapter<{ resource: K8sResourceCommon }, NetworkAdapter>(element, [
        networkAdapterExtensions,
        extensionsLoaded,
      ]),
    [element, extensionsLoaded, networkAdapterExtensions],
  );
  if (!networkAdapter) {
    return [undefined, true, undefined];
  }
  const section = <NetworkTabSection networkAdapter={networkAdapter} />;
  return [section, true, undefined];
};

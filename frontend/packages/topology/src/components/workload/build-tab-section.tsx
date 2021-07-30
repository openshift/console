import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import {
  AdapterDataType,
  BuildAdapter,
  isBuildAdapter,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk/src';
import { BuildConfigData, SideBarTabSection } from '@console/shared';
import { BuildOverview } from './BuildOverview';
import ResolveAdapter from './ResolveAdapter';
import { getDataFromAdapter } from './utils';

const BuildTabSection: React.FC<{ element: GraphElement }> = ({ element }) => {
  const [
    { data: buildConfigs, loaded: buildConfigsDataLoaded },
    setBuildConfigsData,
  ] = React.useState<{
    data?: BuildConfigData;
    loaded: boolean;
  }>({ loaded: false });
  const [buildAdapterExtensions, extensionsResolved] = useResolvedExtensions<BuildAdapter>(
    isBuildAdapter,
  );
  const buildAdapter = React.useMemo(
    () =>
      getDataFromAdapter<AdapterDataType<BuildConfigData>, BuildAdapter>(element, [
        buildAdapterExtensions,
        extensionsResolved,
      ]),
    [buildAdapterExtensions, element, extensionsResolved],
  );
  const handleAdapterResolved = React.useCallback((data) => {
    setBuildConfigsData({ data, loaded: true });
  }, []);
  return buildAdapter ? (
    <SideBarTabSection>
      {extensionsResolved && (
        <ResolveAdapter<BuildConfigData>
          resource={buildAdapter.resource}
          useAdapterHook={buildAdapter.provider}
          onAdapterDataResolved={handleAdapterResolved}
        />
      )}
      {buildConfigsDataLoaded && <BuildOverview buildConfigs={buildConfigs.buildConfigs} />}
    </SideBarTabSection>
  ) : null;
};

export const getBuildsSideBarTabSection = (element: GraphElement) => {
  return <BuildTabSection element={element} />;
};

import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import {
  AdapterDataType,
  BuildAdapter,
  isBuildAdapter,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk/src';
import { BuildConfigData } from '@console/shared';
import TopologySideBarTabSection from '../side-bar/TopologySideBarTabSection';
import { BuildOverview } from './BuildOverview';
import ResolveAdapter from './ResolveAdapter';
import { getDataFromAdapter } from './utils';

const BuildTabSection: React.FC<{ element: GraphElement; renderNull: () => null }> = ({
  element,
  renderNull,
}) => {
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

  React.useEffect(() => {
    if (!buildAdapter) {
      renderNull();
    }
  }, [buildAdapter, renderNull]);

  return buildAdapter ? (
    <TopologySideBarTabSection>
      {extensionsResolved && (
        <ResolveAdapter<BuildConfigData>
          resource={buildAdapter.resource}
          useAdapterHook={buildAdapter.provider}
          onAdapterDataResolved={handleAdapterResolved}
        />
      )}
      {buildConfigsDataLoaded && <BuildOverview buildConfigs={buildConfigs.buildConfigs} />}
    </TopologySideBarTabSection>
  ) : null;
};

export const getBuildsSideBarTabSection = (element: GraphElement, renderNull: () => null) => {
  return <BuildTabSection element={element} renderNull={renderNull} />;
};

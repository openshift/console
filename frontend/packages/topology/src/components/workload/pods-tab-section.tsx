import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import {
  AdapterDataType,
  isPodAdapter,
  PodsAdapterDataType,
  PodAdapter,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import { PodKind } from '@console/internal/module/k8s';
import { PodsOverviewContent } from '@console/shared/src/components/pod/PodsOverview';
import TopologySideBarTabSection from '../side-bar/TopologySideBarTabSection';
import ResolveAdapter from './ResolveAdapter';
import { getDataFromAdapter } from './utils';

const PodsTabSection: React.FC<{ element: GraphElement }> = ({ element }) => {
  const [podAdapterExtension, podAdapterExtensionResolved] = useResolvedExtensions<PodAdapter>(
    isPodAdapter,
  );
  const [{ data: podsData, loaded: podsDataLoaded }, setPodData] = React.useState<{
    data?: PodsAdapterDataType<PodKind>;
    loaded: boolean;
  }>({ loaded: false });
  const podAdapter = React.useMemo(
    () =>
      getDataFromAdapter<AdapterDataType<PodsAdapterDataType<PodKind>>, PodAdapter>(element, [
        podAdapterExtension,
        podAdapterExtensionResolved,
      ]),
    [element, podAdapterExtension, podAdapterExtensionResolved],
  );
  const handleAdapterResolved = React.useCallback((data) => {
    setPodData({ data, loaded: true });
  }, []);
  return podAdapter ? (
    <TopologySideBarTabSection>
      {podAdapterExtensionResolved && (
        <ResolveAdapter<PodsAdapterDataType<PodKind>>
          resource={podAdapter.resource}
          useAdapterHook={podAdapter.provider}
          onAdapterDataResolved={handleAdapterResolved}
        />
      )}
      {podsDataLoaded && podsData.loaded && !podsData.loadError && (
        <PodsOverviewContent obj={podAdapter.resource} {...podsData} />
      )}
    </TopologySideBarTabSection>
  ) : null;
};

export const getPodsSideBarTabSection = (element: GraphElement) => {
  return <PodsTabSection element={element} />;
};

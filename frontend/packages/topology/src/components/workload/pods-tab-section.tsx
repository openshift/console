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
import { SideBarTabSection } from '@console/shared';
import { PodsOverviewContent } from '@console/shared/src/components/pod/PodsOverview';
import ResolveAdapter from './ResolveAdapter';
import { getDataFromAdapter } from './utils';

const PodsTabSection: React.FC<{ element: GraphElement }> = ({ element }) => {
  const [podAdapterExtension, loaded] = useResolvedExtensions<PodAdapter>(isPodAdapter);
  const [{ data: podsData, loaded: podsDataLoaded }, setPodData] = React.useState<{
    data?: PodsAdapterDataType<PodKind>;
    loaded: boolean;
  }>({ loaded: false });
  const podAdapter = React.useMemo(
    () =>
      getDataFromAdapter<AdapterDataType<PodsAdapterDataType<PodKind>>, PodAdapter>(element, [
        podAdapterExtension,
        loaded,
      ]),
    [element, podAdapterExtension, loaded],
  );
  const handleAdapterResolved = React.useCallback((data) => {
    setPodData({ data, loaded: true });
  }, []);
  return podAdapter ? (
    <SideBarTabSection>
      <ResolveAdapter<PodsAdapterDataType<PodKind>>
        resource={podAdapter.resource}
        useAdapterHook={podAdapter.provider}
        onAdapterDataResolved={handleAdapterResolved}
      />
      {podsDataLoaded && podsData.loaded && !podsData.loadError && (
        <PodsOverviewContent obj={podAdapter.resource} {...podsData} />
      )}
    </SideBarTabSection>
  ) : null;
};

export const getPodsSideBarTabSection = (element: GraphElement) => {
  return <PodsTabSection element={element} />;
};

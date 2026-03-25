import type { FC } from 'react';
import { useState, useCallback, useMemo } from 'react';
import type { GraphElement } from '@patternfly/react-topology';
import type {
  AdapterDataType,
  PodsAdapterDataType,
  PodAdapter,
  DetailsTabSectionExtensionHook,
} from '@console/dynamic-plugin-sdk';
import { isPodAdapter, useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import type { PodKind } from '@console/internal/module/k8s';
import { PodsOverviewContent } from '@console/shared/src/components/pod/PodsOverview';
import TopologySideBarTabSection from '../side-bar/TopologySideBarTabSection';
import ResolveAdapter from './ResolveAdapter';
import { getDataFromAdapter } from './utils';

const PodsTabSection: FC<{
  id: string;
  podAdapter: AdapterDataType<PodsAdapterDataType<PodKind>>;
  podAdapterExtensionResolved: boolean;
}> = ({ id, podAdapter, podAdapterExtensionResolved }) => {
  const [{ data: podsData, loaded: podsDataLoaded }, setPodData] = useState<{
    data?: PodsAdapterDataType<PodKind>;
    loaded: boolean;
  }>({ loaded: false });

  const handleAdapterResolved = useCallback(
    (data) => {
      if (podAdapter?.resource?.kind === 'CronJob') {
        // Fixes the issue of Topology page crashing.
        setTimeout(() => setPodData({ data, loaded: true }), 3000);
      } else {
        setPodData({ data, loaded: true });
      }
    },
    [podAdapter],
  );

  return podAdapter ? (
    <TopologySideBarTabSection>
      {podAdapterExtensionResolved && (
        <ResolveAdapter<PodsAdapterDataType<PodKind>>
          key={id}
          resource={podAdapter.resource}
          data={podAdapter.data}
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

export const usePodsSideBarTabSection: DetailsTabSectionExtensionHook = (element: GraphElement) => {
  const [podAdapterExtension, podAdapterExtensionResolved] = useResolvedExtensions<PodAdapter>(
    isPodAdapter,
  );
  const podAdapter = useMemo(
    () =>
      getDataFromAdapter<AdapterDataType<PodsAdapterDataType<PodKind>>, PodAdapter>(element, [
        podAdapterExtension,
        podAdapterExtensionResolved,
      ]),
    [element, podAdapterExtension, podAdapterExtensionResolved],
  );
  if (!podAdapter) {
    return [undefined, true, undefined];
  }
  const section = (
    <PodsTabSection
      id={element.getId()}
      podAdapter={podAdapter}
      podAdapterExtensionResolved={podAdapterExtensionResolved}
    />
  );
  return [section, true, undefined];
};

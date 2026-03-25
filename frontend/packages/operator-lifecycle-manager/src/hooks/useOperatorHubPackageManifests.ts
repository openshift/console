import { useMemo } from 'react';
import type { WatchK8sResult } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { strConcat } from '@console/shared/src';
import type { PackageManifestKind } from '../types';
import { operatorHubPackageFilter } from '../utils/packagemanifests';
import { useMarketplacePackageManifests } from './useMarketplacePackageManifests';
import { usePackageManifests } from './usePackageManifests';

export const useOperatorHubPackageManifests = (
  namespace: string,
): WatchK8sResult<PackageManifestKind[]> => {
  const [packageManifests, packageManifestsLoaded, packageManifestsErr] = usePackageManifests(
    namespace,
  );
  const [
    marketplacePackageManifests,
    marketplacePackageManifestsLoaded,
    marketplacePackageManifestsErr,
  ] = useMarketplacePackageManifests(namespace);
  const loaded = useMemo(() => packageManifestsLoaded && marketplacePackageManifestsLoaded, [
    packageManifestsLoaded,
    marketplacePackageManifestsLoaded,
  ]);
  const loadError = useMemo(() => strConcat(packageManifestsErr, marketplacePackageManifestsErr), [
    packageManifestsErr,
    marketplacePackageManifestsErr,
  ]);

  const operatorHubPackageManifests = useMemo(() => {
    if (!loaded || loadError) {
      return [];
    }
    return [...packageManifests, ...marketplacePackageManifests].filter(operatorHubPackageFilter);
  }, [loaded, loadError, packageManifests, marketplacePackageManifests]);
  return [operatorHubPackageManifests, loaded, loadError];
};

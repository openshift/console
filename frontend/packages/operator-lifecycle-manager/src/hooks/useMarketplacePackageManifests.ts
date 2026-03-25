import type { WatchK8sResult } from '@console/dynamic-plugin-sdk/src/lib-core';
import {
  useK8sWatchResource,
  getGroupVersionKindForModel,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { PackageManifestModel } from '../models';
import type { PackageManifestKind } from '../types';

export const useMarketplacePackageManifests = (
  namespace: string,
): WatchK8sResult<PackageManifestKind[]> =>
  useK8sWatchResource<PackageManifestKind[]>({
    isList: true,
    namespace,
    groupVersionKind: getGroupVersionKindForModel(PackageManifestModel),
    selector: { matchLabels: { 'openshift-marketplace': 'true' } },
  });

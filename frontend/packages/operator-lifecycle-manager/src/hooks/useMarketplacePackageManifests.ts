import {
  useK8sWatchResource,
  getGroupVersionKindForModel,
  WatchK8sResult,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { PackageManifestModel } from '../models';
import { PackageManifestKind } from '../types';

export const useMarketplacePackageManifests = (
  namespace: string,
): WatchK8sResult<PackageManifestKind[]> =>
  useK8sWatchResource<PackageManifestKind[]>({
    isList: true,
    namespace,
    groupVersionKind: getGroupVersionKindForModel(PackageManifestModel),
    selector: { matchLabels: { 'openshift-marketplace': 'true' } },
  });

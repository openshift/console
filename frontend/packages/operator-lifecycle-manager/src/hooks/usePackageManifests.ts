import {
  useK8sWatchResource,
  getGroupVersionKindForModel,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import type { WatchK8sResult } from '@console/internal/module/k8s';
import { fromRequirements } from '@console/internal/module/k8s/selector';
import { PackageManifestModel } from '../models';
import type { PackageManifestKind } from '../types';

export const usePackageManifests = (namespace: string): WatchK8sResult<PackageManifestKind[]> =>
  useK8sWatchResource<PackageManifestKind[]>({
    isList: true,
    groupVersionKind: getGroupVersionKindForModel(PackageManifestModel),
    namespace,
    selector: fromRequirements([
      { key: 'opsrc-owner-name', operator: 'DoesNotExist' },
      { key: 'csc-owner-name', operator: 'DoesNotExist' },
    ]),
  });

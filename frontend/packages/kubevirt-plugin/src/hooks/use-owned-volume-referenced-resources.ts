/* eslint-disable react-hooks/exhaustive-deps */
import * as _ from 'lodash';
import * as React from 'react';

import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceCommon, OwnerReference } from '@console/internal/module/k8s';
import { getOwnerReferences } from '@console/shared/src';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';

import { VolumeReferencedObject, VolumeWrapper } from '../k8s/wrapper/vm/volume-wrapper';
import { V1Volume } from '../types/api';
import { K8sResourceWithModel } from '../types/k8s-resource-with-model';
import { kvReferenceForModel } from '../models/kvReferenceForModel';

export const useOwnedVolumeReferencedResources = (
  initialOwner: OwnerReference,
  initialNamespace: string,
  volumes: V1Volume[],
) => {
  const volumeOwner = React.useMemo(() => initialOwner, []);
  const namespace = React.useMemo(() => initialNamespace, []);

  const referencedObjectLookup = React.useMemo(
    () =>
      (volumes || []).reduce((acc, volume) => {
        const ref = new VolumeWrapper(volume).getReferencedObject();
        if (ref) {
          acc[volume.name] = ref;
        }
        return acc;
      }, {} as { [key: string]: VolumeReferencedObject }),
    [volumes],
  );

  const resourceWatches = React.useMemo(
    () =>
      Object.keys(referencedObjectLookup).reduce((acc, volumeName) => {
        const ref = referencedObjectLookup[volumeName];
        acc[volumeName] = {
          name: ref.name,
          kind: kvReferenceForModel(ref.model),
          namespace,
          isList: false,
        };
        return acc;
      }, {}),
    [namespace, referencedObjectLookup],
  );

  const results = useK8sWatchResources<{ [key: string]: K8sResourceCommon }>(resourceWatches);

  let isLoaded = true;

  const ownedResources = Object.keys(results)
    .map((volumeName) => {
      const { data, loaded, loadError } = results[volumeName];

      if (!loaded || loadError) {
        if (loadError?.json?.code !== 404) {
          isLoaded = false;
        }
        return null;
      }

      if (
        !_.isEmpty(data) &&
        (getOwnerReferences(data) || []).some((ownerReference) =>
          compareOwnerReference(ownerReference, volumeOwner),
        )
      ) {
        const referencedObject = referencedObjectLookup[volumeName];
        return {
          model: referencedObject.model,
          resource: data,
        };
      }
      return null;
    })
    .filter((r) => r);

  return [ownedResources, isLoaded] as [K8sResourceWithModel[], boolean];
};

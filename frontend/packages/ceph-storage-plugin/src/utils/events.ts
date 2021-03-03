import * as _ from 'lodash';
import { EventKind } from '@console/internal/module/k8s';
import { PersistentVolumeClaimModel, PersistentVolumeModel } from '@console/internal/models';
import { getNamespace } from '@console/shared/src/selectors/common';
import {
  NooBaaBackingStoreModel,
  NooBaaBucketClassModel,
  NooBaaObjectBucketClaimModel,
  CephObjectStoreModel,
} from '../models';
import { CEPH_STORAGE_NAMESPACE } from '../constants';

export const isObjectStorageEvent = (event: EventKind): boolean => {
  const eventKind: string = event?.involvedObject?.kind;
  const objectStorageResources = [
    NooBaaBackingStoreModel.kind,
    NooBaaBucketClassModel.kind,
    NooBaaObjectBucketClaimModel.kind,
    CephObjectStoreModel.kind,
  ];
  if (eventKind !== PersistentVolumeClaimModel.kind && eventKind !== PersistentVolumeModel.kind) {
    const eventName: string = event?.involvedObject?.name;
    return _.startsWith(eventName, 'noobaa') || eventName?.includes('rgw');
  }
  return objectStorageResources.includes(eventKind);
};

export const isPersistentStorageEvent = (pvcs: string[]) => (event: EventKind): boolean => {
  if (isObjectStorageEvent(event)) return false;
  const eventKind = event?.involvedObject?.kind;
  const eventNamespace = getNamespace(event);
  const eventObjectName = event?.involvedObject?.name;
  return eventKind === PersistentVolumeClaimModel.kind
    ? pvcs.includes(eventObjectName)
    : eventNamespace === CEPH_STORAGE_NAMESPACE;
};

import { K8sResourceCommon } from '@console/internal/module/k8s';
import { PROVIDERS_NOOBAA_MAP, NOOBAA_TYPE_MAP } from './constants';

export type SpecProvider = typeof PROVIDERS_NOOBAA_MAP[keyof typeof PROVIDERS_NOOBAA_MAP];
export type SpecType = typeof NOOBAA_TYPE_MAP[keyof typeof NOOBAA_TYPE_MAP];

export enum PlacementPolicy {
  Spread = 'Spread',
  Mirror = 'Mirror',
}

export type K8sListResponse<T> = {
  items: T[];
};

export type BackingStoreKind = K8sResourceCommon & {
  spec: {
    [key in SpecProvider]: {
      [key: string]: string;
    };
  } & {
    type: SpecType;
  };
};

export type BucketClassKind = K8sResourceCommon & {
  spec: {
    placementPolicy: {
      tiers: {
        backingStores: string[];
        placement: PlacementPolicy;
      }[];
    };
  };
};

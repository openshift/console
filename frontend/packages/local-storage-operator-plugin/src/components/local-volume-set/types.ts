import { K8sResourceCommon, Toleration } from '@console/internal/module/k8s';

export enum DiskType {
  RawDisk = 'disk',
  Partition = 'part',
}

export enum DiskMechanicalProperties {
  'NonRotational' = 'NonRotational',
  'Rotational' = 'Rotational',
}

export type LocalVolumeSetKind = K8sResourceCommon & {
  spec: {
    storageClassName: string;
    volumeMode: string;
    fsType: string;
    deviceInclusionSpec: {
      deviceTypes?: DiskType[];
      deviceMechanicalProperties: [keyof typeof DiskMechanicalProperties];
      minSize?: string;
      maxSize?: string;
    };
    nodeSelector?: {
      nodeSelectorTerms: {
        matchExpressions: { key: string; operator: string; values: string[] }[];
      }[];
    };
    maxDeviceCount?: number;
    tolerations?: Toleration[];
  };
};

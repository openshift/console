import { IRow } from '@patternfly/react-table';
import { NodeKind, K8sResourceCommon } from '@console/internal/module/k8s';

export type NodeTableRow = {
  cells: IRow['cells'];
  selected: IRow['selected'];
  props: {
    data: NodeKind;
    uid: string;
  };
};

export type RowUIDMap = {
  [key: string]: NodeTableRow;
};

export enum DiskType {
  SSD = 'SSD',
  HDD = 'HDD',
}

export enum DeviceType {
  RawDisk = 'RawDisk',
  Partition = 'Partition',
}

export enum DeviceMechanicalProperty {
  SSD = 'Rotational',
  HDD = 'NonRotational',
}

export type LocalVolumeSetKind = K8sResourceCommon & {
  spec: {
    storageClassName: string;
    volumeMode: string;
    deviceInclusionSpec: {
      deviceTypes: DeviceType[];
      deviceMechanicalProperty: DeviceMechanicalProperty[];
      minSize?: number;
      maxSize?: number;
    };
    nodeSelector?: {
      nodeSelectorTerms: [
        {
          matchExpressions: [{ key: string; operator: string; values: string[] }];
        },
      ];
    };
    maxDeviceCount?: number;
  };
};

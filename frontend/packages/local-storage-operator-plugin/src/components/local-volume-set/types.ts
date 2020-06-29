import { IRow } from '@patternfly/react-table';
import { NodeKind, K8sResourceCommon } from '@console/internal/module/k8s';

export type NodeTableRow = {
  cells: IRow['cells'];
  props: {
    id: string;
  };
  selected: boolean;
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

export type GetRows = (
  {
    componentProps,
  }: {
    componentProps: { data: NodeKind[] };
  },
  visibleRows: Set<string>,
  setVisibleRows: React.Dispatch<React.SetStateAction<Set<string>>>,
  selectedNodes: Set<string>,
) => NodeTableRow[];

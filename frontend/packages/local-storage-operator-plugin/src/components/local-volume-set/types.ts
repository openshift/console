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
  RawDisk = 'disk',
  Partition = 'part',
}

export enum DiskMechanicalProperties {
  SSD = 'NonRotational',
  HDD = 'Rotational',
}

export type LocalVolumeSetKind = K8sResourceCommon & {
  spec: {
    storageClassName: string;
    volumeMode: string;
    deviceInclusionSpec: {
      deviceTypes?: DiskType[];
      deviceMechanicalProperties: DiskMechanicalProperties[];
      minSize?: string;
      maxSize?: string;
    };
    nodeSelector?: {
      nodeSelectorTerms: {
        matchExpressions: { key: string; operator: string; values: string[] }[];
      }[];
    };
    maxDeviceCount?: number;
  };
};

export type GetRows = (
  {
    componentProps,
    customData,
  }: {
    componentProps: { data: NodeKind[] };
    customData?: {
      filteredNodes: string[];
      preSelected?: string[];
    };
  },
  visibleRows: Set<string>,
  setVisibleRows: React.Dispatch<React.SetStateAction<Set<string>>>,
  selectedNodes: Set<string>,
  setSelectedNodes?: (nodes: NodeKind[]) => void,
) => NodeTableRow[];

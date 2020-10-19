import { IRow } from '@patternfly/react-table';
import { NodeKind } from '@console/internal/module/k8s';
import { TableProps } from '@console/internal/components/factory';

type NodeTableRow = {
  cells: IRow['cells'];
  props: {
    id: string;
  };
  selected?: boolean;
};

export type GetRows = (
  {
    componentProps,
    customData,
  }: {
    componentProps: { data: NodeKind[] };
    customData?: {
      onRowSelected?: (nodes: NodeKind[]) => void;
      nodes?: NodeKind[];
      filteredNodes?: string[];
      setNodes?: (nodes: NodeKind[]) => void;
    };
  },
  visibleRows?: Set<string>,
  setVisibleRows?: React.Dispatch<React.SetStateAction<Set<string>>>,
  selectedNodes?: Set<string>,
  setSelectedNodes?: (nodes: NodeKind[]) => void,
) => NodeTableRow[];

export type NodeTableProps = TableProps & {
  data: NodeKind[];
  customData?: {
    onRowSelected?: (nodes: NodeKind[]) => void;
    nodes?: NodeKind[];
    filteredNodes?: string[];
    setNodes?: (nodes: NodeKind[]) => void;
  };
  filters: { name: string; label: { all: string[] } };
};

import { NodeKind } from '@console/internal/module/k8s';
import { IRow } from '@patternfly/react-table';

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
      filteredNodes: string[];
      setNodes: React.Dispatch<React.SetStateAction<NodeKind[]>>;
      nodes: NodeKind[];
    };
  },
  visibleRows?: Set<string>,
  setVisibleRows?: React.Dispatch<React.SetStateAction<Set<string>>>,
  selectedNodes?: Set<string>,
  setSelectedNodes?: (nodes: NodeKind[]) => void,
) => NodeTableRow[];

export type NodeTableProps = {
  data: NodeKind[];
  customData?: {
    onRowSelected: (nodes: NodeKind[]) => void;
  };
  filters: { name: string; label: { all: string[] } };
};

import { IRow } from '@patternfly/react-table';
import { NodeKind } from '@console/internal/module/k8s';

export type NodeTableRow = {
  cells: IRow['cells'];
  props: {
    id: string;
  };
  selected: boolean;
};

export type NodesTableCustomData = {
  /**
   * Callback to be invoked when any node is selected.
   */
  onRowSelected: (nodes: NodeKind[]) => void;
  /**
   * Names of nodes that are already selected.
   */
  preSelectedNodes: string[];
  /**
   * Controls the display of checkboxes
   */
  hasOnSelect: boolean;
  /**
   * To display a set of nodes only.
   * These set of nodes should be already filtered for taints and
   * custom taints filter .By default all nodes present in the
   * cluster are displayed.
   */
  filteredNodes?: string[];
  /**
   * Custom Function to allow a specific set of taints.
   * By default tainted nodes are not displayed.
   */
  taintsFilter?: (node: NodeKind) => boolean;
};

export type NodesTableRowsFunction = (
  {
    componentProps,
    customData,
  }: {
    componentProps: { data: NodeKind[] };
    customData: NodesTableCustomData;
  },
  visibleRows: Set<string>,
  setVisibleRows: React.Dispatch<React.SetStateAction<Set<string>>>,
  selectedNodes: Set<string>,
  setSelectedNodes?: (nodes: NodeKind[]) => void,
) => NodeTableRow[];

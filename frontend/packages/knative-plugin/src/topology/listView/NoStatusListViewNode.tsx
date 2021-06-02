import * as React from 'react';
import { TopologyListViewNode } from '@console/topology/src/components/list-view';
import { OdcBaseNode } from '@console/topology/src/elements';

interface NoStatusListViewNodeProps {
  item: OdcBaseNode;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const NoStatusListViewNode: React.FC<NoStatusListViewNodeProps> = (props) => (
  <TopologyListViewNode noPods {...props} />
);

export { NoStatusListViewNode };

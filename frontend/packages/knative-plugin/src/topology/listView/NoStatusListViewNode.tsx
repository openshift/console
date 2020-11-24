import * as React from 'react';
import { OdcBaseNode } from '@console/topology/src/elements';
import { TopologyListViewNode } from '@console/topology/src/components/list-view';

interface NoStatusListViewNodeProps {
  item: OdcBaseNode;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const NoStatusListViewNode: React.FC<NoStatusListViewNodeProps> = (props) => (
  <TopologyListViewNode noPods {...props} />
);

export { NoStatusListViewNode };

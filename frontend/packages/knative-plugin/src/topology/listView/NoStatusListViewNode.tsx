import * as React from 'react';
import { OdcBaseNode, TopologyListViewNode } from '@console/dev-console/src/components/topology';

interface NoStatusListViewNodeProps {
  item: OdcBaseNode;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

const NoStatusListViewNode: React.FC<NoStatusListViewNodeProps> = (props) => (
  <TopologyListViewNode noPods {...props} />
);

export { NoStatusListViewNode };

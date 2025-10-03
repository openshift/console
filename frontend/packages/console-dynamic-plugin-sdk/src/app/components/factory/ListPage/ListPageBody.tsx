import * as React from 'react';
import type { ReactNode } from 'react';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

interface ListPageBodyProps {
  children?: ReactNode;
}

const ListPageBody: React.FC<ListPageBodyProps> = ({ children }) => {
  return <PaneBody>{children}</PaneBody>;
};

export default ListPageBody;

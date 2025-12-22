import type { FC, ReactNode } from 'react';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

interface ListPageBodyProps {
  children?: ReactNode;
}

const ListPageBody: FC<ListPageBodyProps> = ({ children }) => {
  return <PaneBody>{children}</PaneBody>;
};

export default ListPageBody;

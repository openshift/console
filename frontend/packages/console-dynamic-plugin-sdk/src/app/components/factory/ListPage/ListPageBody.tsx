import * as React from 'react';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

const ListPageBody: React.FC = ({ children }) => {
  return <PaneBody>{children}</PaneBody>;
};

export default ListPageBody;

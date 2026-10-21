import type { FC } from 'react';
import type { GraphElement } from '@patternfly/react-topology';
import SideBarBody from './components/SideBarBody';
import SideBarHeading from './components/SideBarHeading';

const TopologySideBarContent: FC<{ element: GraphElement }> = ({ element }) => {
  return (
    <div className="overview__sidebar-pane resource-overview">
      <SideBarHeading element={element} />
      <SideBarBody element={element} />
    </div>
  );
};

export default TopologySideBarContent;

import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import SideBarBody from './components/SideBarBody';
import SideBarHeading from './components/SideBarHeading';

const TopologySideBarContent: React.FC<{ element: GraphElement }> = ({ element }) => {
  return (
    <div className="overview__sidebar-pane resource-overview">
      <SideBarHeading element={element} />
      <SideBarBody element={element} />
    </div>
  );
};

export default TopologySideBarContent;

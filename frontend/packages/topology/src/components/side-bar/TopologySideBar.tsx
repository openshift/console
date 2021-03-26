import * as React from 'react';
import { TopologySideBar as PFTopologySideBar } from '@patternfly/react-topology';
import { CloseButton } from '@console/internal/components/utils';

type TopologySideBarProps = {
  show: boolean;
  onClose: () => void;
};

const TopologySideBar: React.FC<TopologySideBarProps> = ({ children, show, onClose }) => (
  <PFTopologySideBar show={show}>
    <div className="co-sidebar-dismiss clearfix">
      <CloseButton onClick={onClose} data-test-id="sidebar-close-button" />
    </div>
    {children}
  </PFTopologySideBar>
);

export default TopologySideBar;

import * as React from 'react';
import { TopologySideBar as PFTopologySideBar } from '@patternfly/react-topology';
import CloseButton from '@console/shared/src/components/close-button';

type TopologySideBarProps = {
  show: boolean;
  onClose: () => void;
};

const TopologySideBar: React.FC<TopologySideBarProps> = ({ children, show, onClose }) => (
  <PFTopologySideBar show={show}>
    <div className="co-sidebar-dismiss clearfix">
      <CloseButton
        onClick={onClose}
        dataTestID="sidebar-close-button"
        additionalClassName="co-close-button--float-right co-sidebar-dismiss__close-button"
      />
    </div>
    {children}
  </PFTopologySideBar>
);

export default TopologySideBar;

import * as React from 'react';
import { CloseButton } from '@patternfly/react-component-groups';
import { DrawerPanelContent } from '@patternfly/react-core';
import { TopologySideBar as PFTopologySideBar } from '@patternfly/react-topology';
import { useUserSettings } from '@console/shared/src/hooks/useUserSettings';
import { TOPOLOGY_SIDE_BAR_WIDTH_STORAGE_KEY } from '../../const';
import './TopologySideBarTabSection.scss';

type TopologySideBarProps = {
  children?: React.ReactNode;
  onClose: () => void;
};

const DEFAULT_SIDE_BAR_SIZE = 500;

const TopologySideBar: React.FCC<TopologySideBarProps> = ({ children, onClose }) => {
  const [sideBarSize, setSideBarSize, sideBarSizeLoaded] = useUserSettings(
    TOPOLOGY_SIDE_BAR_WIDTH_STORAGE_KEY,
    DEFAULT_SIDE_BAR_SIZE,
  );
  const handleResizeCallback = React.useCallback(
    (_event, width: number) => {
      setSideBarSize(width);
    },
    [setSideBarSize],
  );
  return (
    <DrawerPanelContent
      isResizable
      minSize="400px"
      defaultSize={`${sideBarSizeLoaded ? sideBarSize : DEFAULT_SIDE_BAR_SIZE}px`}
      onResize={handleResizeCallback}
      className="ocs-sidebar-index"
    >
      <PFTopologySideBar
        resizable
        className="pf-topology-side-bar-resizable"
        data-test="topology-sidepane"
      >
        <div className="pf-topology-side-bar__body">
          <div className="co-sidebar-dismiss">
            <CloseButton
              onClick={onClose}
              data-test="sidebar-close-button"
              className="co-sidebar-dismiss__close-button"
            />
          </div>
          {children}
        </div>
      </PFTopologySideBar>
    </DrawerPanelContent>
  );
};

export default TopologySideBar;

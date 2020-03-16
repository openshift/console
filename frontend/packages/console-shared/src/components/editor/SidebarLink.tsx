import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';

interface SidebarLinkProps {
  onToggleSidebar?: () => {};
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ onToggleSidebar }) => (
  <>
    <div className="co-action-divider">|</div>
    <div className="ocs-yaml-editor__link">
      <Button type="button" variant="link" isInline onClick={onToggleSidebar}>
        <InfoCircleIcon className="co-icon-space-r co-p-has-sidebar__sidebar-link-icon" />
        View sidebar
      </Button>
    </div>
  </>
);

export default SidebarLink;

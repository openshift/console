import * as React from 'react';
import { history } from '@console/internal/components/utils';
import { Tooltip, Button } from '@patternfly/react-core';

interface TopologyToggleIconProps {
  url: string;
  icon: React.ReactNode;
  tooltipText: string;
}

const TopologyToggleIcon: React.FC<TopologyToggleIconProps> = ({ url, icon, tooltipText }) => {
  return (
    <Tooltip position="left" content={tooltipText}>
      <Button variant="link" onClick={() => history.push(url)}>
        {icon}
      </Button>
    </Tooltip>
  );
};

export default TopologyToggleIcon;

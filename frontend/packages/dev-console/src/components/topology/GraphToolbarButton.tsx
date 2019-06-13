import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';

import './GraphToolbarButton.scss';

export interface GraphToolbarButtonProps {
  label: string;
  children: React.ReactNode;
  onClick(): void;
}

const GraphToolbarButton: React.FC<GraphToolbarButtonProps> = ({ label, onClick, children }) => (
  // set enableFlip to false for now because PF does not properly align the arrow
  <Tooltip content={label} position={TooltipPosition.top} enableFlip={false}>
    <button type="button" className="odc-graph-toolbar-button" onClick={onClick} aria-label={label}>
      {children}
    </button>
  </Tooltip>
);

export default GraphToolbarButton;

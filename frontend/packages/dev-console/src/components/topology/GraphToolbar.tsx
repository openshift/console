import * as React from 'react';

import './GraphToolbar.scss';

export interface GraphToolbarProps {
  children: React.ReactNode;
}

const GraphToolbar: React.FC<GraphToolbarProps> = ({ children }) => (
  <div className="odc-graph-toolbar">{children}</div>
);

export default GraphToolbar;

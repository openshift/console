import * as React from 'react';
import CloudShellTerminal from './CloudShellTerminal';
import './CloudShellTab.scss';
import { InlineTechPreviewBadge } from '@console/shared';

const CloudShellTab: React.FC = () => (
  <div className="co-cloud-shell-tab">
    <div className="co-cloud-shell-tab__header">
      <div className="co-cloud-shell-tab__header-text">OpenShift command line terminal</div>
      <InlineTechPreviewBadge />
    </div>
    <CloudShellTerminal />
  </div>
);

export default CloudShellTab;

import * as React from 'react';
import CloudShellTerminal from './CloudShellTerminal';
import './CloudShellTab.scss';

const CloudShellTab: React.FC = () => (
  <div className="co-cloud-shell-tab">
    <div className="co-cloud-shell-tab__header">OpenShift command line terminal</div>
    <CloudShellTerminal />
  </div>
);

export default CloudShellTab;

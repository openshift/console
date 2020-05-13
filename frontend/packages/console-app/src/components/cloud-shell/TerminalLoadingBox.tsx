import * as React from 'react';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import './CloudShellTerminal.scss';

type TerminalLoadingBoxProps = {
  message?: string;
};
const TerminalLoadingBox: React.FC<TerminalLoadingBoxProps> = ({ message }) => (
  <div className="odc-cloudshell-terminal__container">
    <LoadingBox message={message || 'Connecting to your OpenShift command line terminal ...'} />
  </div>
);

export default TerminalLoadingBox;

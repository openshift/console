import * as React from 'react';
import { LoadingBox } from '@console/internal/components/utils';
import './CloudShellTerminalFrame.scss';

type CloudShellTerminalFrameProps = {
  loading?: boolean;
  url?: string;
};

const CloudShellTerminalFrame: React.FC<CloudShellTerminalFrameProps> = ({ loading, url }) => (
  <div className="co-cloud-shell-terminal-frame">
    {loading ? <LoadingBox /> : <iframe title="Command Line Terminal" src={url} />}
  </div>
);

export default CloudShellTerminalFrame;

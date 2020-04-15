import * as React from 'react';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import './CloudShellTerminalFrame.scss';

type CloudShellTerminalFrameProps = {
  loading?: boolean;
  url?: string;
};

const CloudShellTerminalFrame: React.FC<CloudShellTerminalFrameProps> = ({ loading, url }) => (
  <div className="co-cloud-shell-terminal-frame">
    {loading ? (
      <LoadingBox message="Connecting to your OpenShift command line terminal…" />
    ) : (
      <iframe title="Command line terminal" src={url} />
    )}
  </div>
);

export default CloudShellTerminalFrame;

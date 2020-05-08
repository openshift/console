import * as React from 'react';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import { PodExecLoader } from '../../../../../public/components/pod';
import './CloudShellTerminalFrame.scss';
import { PodKind } from '@console/internal/module/k8s';

type CloudShellTerminalFrameProps = {
  loading?: boolean;
  obj?: PodKind;
};

const CloudShellTerminalFrame: React.FC<CloudShellTerminalFrameProps> = ({ loading, obj }) => {
  const message = <p>Welcome to OpenShift terminal!!</p>;
  return (
    <div className="co-cloud-shell-terminal-frame">
      {loading || !obj ? (
        <LoadingBox message="Connecting to your OpenShift command line terminal…" />
      ) : (
        <PodExecLoader obj={obj} message={message} header={false} />
      )}
    </div>
  );
};

export default CloudShellTerminalFrame;

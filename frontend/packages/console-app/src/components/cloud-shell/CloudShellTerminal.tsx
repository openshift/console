import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { StatusBox } from '@console/internal/components/utils/status-box';
import { WorkspaceModel } from '../../models';
import CloudshellExec from './CloudShellExec';
import TerminalLoadingBox from './TerminalLoadingBox';
import {
  CLOUD_SHELL_LABEL,
  CLOUD_SHELL_USER_ANNOTATION,
  CloudShellResource,
  TerminalInitData,
  initTerminal,
} from './cloud-shell-utils';
import CloudShellSetup from './setup/CloudShellSetup';
import './CloudShellTerminal.scss';

type StateProps = {
  username: string;
};

type Props = {
  onCancel?: () => void;
};

type CloudShellTerminalProps = StateProps & Props;

const resource = {
  kind: referenceForModel(WorkspaceModel),
  isList: true,
  selector: {
    matchLabels: { [CLOUD_SHELL_LABEL]: 'true' },
  },
};

const CloudShellTerminal: React.FC<CloudShellTerminalProps> = ({ username, onCancel }) => {
  const [data, loaded, loadError] = useK8sWatchResource<CloudShellResource[]>(resource);
  const [initData, setInitData] = React.useState<TerminalInitData>();
  const [initDataLoading, setInitDataLoading] = React.useState<boolean>(false);
  const [initError, setInitError] = React.useState<string>();
  let workspace: CloudShellResource;
  let workspaceName: string;
  let workspaceNamespace: string;
  let workspacePhase: string;

  if (Array.isArray(data)) {
    workspace = data.find(
      (ws) => ws?.metadata?.annotations?.[CLOUD_SHELL_USER_ANNOTATION] === username,
    );
    workspacePhase = workspace?.status?.phase;
    workspaceName = workspace?.metadata?.name;
    workspaceNamespace = workspace?.metadata?.namespace;
  }

  React.useEffect(() => {
    let unmounted = false;

    if (workspacePhase === 'Running') {
      setInitDataLoading(true);
      initTerminal(username, workspaceName, workspaceNamespace)
        .then((res: TerminalInitData) => {
          if (unmounted) return;
          setInitData(res);
          setInitDataLoading(false);
        })
        .catch(() => {
          if (unmounted) return;
          setInitDataLoading(false);
          setInitError('Failed to connect to your OpenShift command line terminal');
        });
    }

    return () => {
      unmounted = true;
    };
  }, [username, workspaceName, workspaceNamespace, workspacePhase]);

  if (loadError || initError) {
    return (
      <StatusBox
        loaded={loaded}
        loadError={loadError || initError}
        label="OpenShift command line terminal"
      />
    );
  }

  if (!loaded || initDataLoading) {
    return (
      <div className="odc-cloudshell-terminal__container">
        <TerminalLoadingBox />
      </div>
    );
  }

  if (initData && workspaceNamespace) {
    return (
      <div className="odc-cloudshell-terminal__container">
        <CloudshellExec
          namespace={workspaceNamespace}
          container={initData.container}
          podname={initData.pod}
          shcommand={initData.cmd || []}
        />
      </div>
    );
  }

  if (loaded && !workspace) return <CloudShellSetup onCancel={onCancel} />;

  return null;
};

// For testing
export const InternalCloudShellTerminal = CloudShellTerminal;

const stateToProps = (state: RootState): StateProps => ({
  username: state.UI.get('user')?.metadata?.name || '',
});

export default connect(stateToProps)(CloudShellTerminal);

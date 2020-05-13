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
  initTerminal,
  InitResponseObject,
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
  const [data, loaded, loadError] = useK8sWatchResource<CloudShellResource>(resource);
  const [workspacePod, setWorkspacePod] = React.useState<InitResponseObject>(null);
  const [apiError, setApiError] = React.useState<string>(null);

  React.useEffect(() => {
    if (Array.isArray(data)) {
      const workspace = data.find(
        (d) => d?.metadata?.annotations?.[CLOUD_SHELL_USER_ANNOTATION] === username,
      );

      if (workspace && !workspacePod) {
        const running = workspace.status?.phase === 'Running';
        if (running) {
          initTerminal(username, workspace.metadata.name, workspace.metadata.namespace)
            .then((res) => {
              setWorkspacePod({
                pod: res.pod,
                container: res.container,
                cmd: res.cmd || [],
              });
            })
            .catch(() => {
              setApiError('Failed to connect to your OpenShift command line terminal');
            });
        }
      }
    }
  }, [data, username, workspacePod]);

  let workSpace = null;

  if (Array.isArray(data)) {
    workSpace = data.find(
      (d) => d?.metadata?.annotations?.[CLOUD_SHELL_USER_ANNOTATION] === username,
    );
  }

  if (loadError || apiError) {
    return (
      <StatusBox
        loaded={loaded}
        loadError={loadError || apiError}
        label="OpenShift command line terminal"
      />
    );
  }

  if (!loaded || (workSpace?.metadata.namespace && !workspacePod)) {
    return <TerminalLoadingBox message={!loaded ? 'Loading ...' : null} />;
  }

  if (workspacePod) {
    return (
      <div className="odc-cloudshell-terminal__container">
        <CloudshellExec
          container={workspacePod.container}
          podname={workspacePod.pod}
          namespace={workSpace?.metadata.namespace}
          shcommand={workspacePod.cmd}
        />
      </div>
    );
  }
  return <CloudShellSetup onCancel={onCancel} />;
};

// For testing
export const InternalCloudShellTerminal = CloudShellTerminal;

const stateToProps = (state: RootState): StateProps => ({
  username: state.UI.get('user')?.metadata?.name || '',
});

export default connect(stateToProps)(CloudShellTerminal);

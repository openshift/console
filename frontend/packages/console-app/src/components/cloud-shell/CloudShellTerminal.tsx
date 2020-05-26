import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { StatusBox, LoadError } from '@console/internal/components/utils/status-box';
import { UserKind } from '@console/internal/module/k8s';
import { WorkspaceModel } from '../../models';
import CloudshellExec from './CloudShellExec';
import TerminalLoadingBox from './TerminalLoadingBox';
import {
  CLOUD_SHELL_LABEL,
  CLOUD_SHELL_IMMUTABLE_ANNOTATION,
  CLOUD_SHELL_CREATOR_LABEL,
  CloudShellResource,
  TerminalInitData,
  initTerminal,
} from './cloud-shell-utils';
import CloudShellSetup from './setup/CloudShellSetup';
import './CloudShellTerminal.scss';

type StateProps = {
  user: UserKind;
};

type Props = {
  onCancel?: () => void;
};

type CloudShellTerminalProps = StateProps & Props;

const CloudShellTerminal: React.FC<CloudShellTerminalProps> = ({ user, onCancel }) => {
  const uid = user?.metadata?.uid;
  const username = user?.metadata?.name;
  const isKubeAdmin = !uid && username === 'kube:admin';
  const resource: WatchK8sResource = React.useMemo(
    () => ({
      kind: referenceForModel(WorkspaceModel),
      isList: true,
      selector: {
        matchLabels: {
          [CLOUD_SHELL_LABEL]: 'true',
          [CLOUD_SHELL_CREATOR_LABEL]: isKubeAdmin ? '' : uid,
        },
      },
    }),
    [isKubeAdmin, uid],
  );
  const [data, loaded, loadError] = useK8sWatchResource<CloudShellResource[]>(resource);
  const [initData, setInitData] = React.useState<TerminalInitData>();
  const [initError, setInitError] = React.useState<string>();
  let workspace: CloudShellResource;
  let workspaceName: string;
  let workspaceNamespace: string;
  let workspacePhase: string;

  if (Array.isArray(data)) {
    workspace = data.find(
      (d) =>
        d?.metadata?.annotations?.[CLOUD_SHELL_IMMUTABLE_ANNOTATION] === 'true' &&
        !d?.metadata?.deletionTimestamp,
    );
    workspacePhase = workspace?.status?.phase;
    workspaceName = workspace?.metadata?.name;
    workspaceNamespace = workspace?.metadata?.namespace;
  }

  React.useEffect(() => {
    let unmounted = false;

    setInitError(undefined);
    if (workspacePhase === 'Running') {
      initTerminal(username, workspaceName, workspaceNamespace)
        .then((res: TerminalInitData) => {
          if (!unmounted) setInitData(res);
        })
        .catch((e) => {
          if (!unmounted) {
            const defaultError = 'Failed to connect to your OpenShift command line terminal';
            if (e?.response?.headers?.get('Content-Type')?.startsWith('text/plain')) {
              // eslint-disable-next-line promise/no-nesting
              e.response
                .text()
                .then((text) => {
                  setInitError(text);
                })
                .catch(() => {
                  setInitError(defaultError);
                });
            } else {
              setInitError(defaultError);
            }
          }
        });
    }

    return () => {
      unmounted = true;
    };
  }, [username, workspaceName, workspaceNamespace, workspacePhase]);

  if (loadError) {
    return (
      <StatusBox loaded={loaded} loadError={loadError} label="OpenShift command line terminal" />
    );
  }

  if (initError) {
    return <LoadError message={initError} label="OpenShift command line terminal" />;
  }

  if (!loaded || (workspaceName && !initData)) {
    return (
      <div className="co-cloudshell-terminal__container">
        <TerminalLoadingBox />
      </div>
    );
  }

  if (initData && workspaceNamespace) {
    return (
      <div className="co-cloudshell-terminal__container">
        <CloudshellExec
          workspaceName={workspaceName}
          namespace={workspaceNamespace}
          container={initData.container}
          podname={initData.pod}
          shcommand={initData.cmd || []}
        />
      </div>
    );
  }

  return <CloudShellSetup onCancel={onCancel} />;
};

// For testing
export const InternalCloudShellTerminal = CloudShellTerminal;

const stateToProps = (state: RootState): StateProps => ({
  user: state.UI.get('user'),
});

export default connect(stateToProps)(CloudShellTerminal);

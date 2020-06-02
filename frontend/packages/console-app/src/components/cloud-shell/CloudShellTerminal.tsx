import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { StatusBox, LoadError } from '@console/internal/components/utils/status-box';
import { UserKind } from '@console/internal/module/k8s';
import CloudshellExec from './CloudShellExec';
import TerminalLoadingBox from './TerminalLoadingBox';
import {
  TerminalInitData,
  initTerminal,
  getCloudShellNamespace,
  setCloudShellNamespace,
} from './cloud-shell-utils';
import CloudShellSetup from './setup/CloudShellSetup';
import useCloudShellWorkspace from './useCloudShellWorkspace';

import './CloudShellTerminal.scss';

type StateProps = {
  user: UserKind;
};

type Props = {
  onCancel?: () => void;
};

type CloudShellTerminalProps = StateProps & Props;

const CloudShellTerminal: React.FC<CloudShellTerminalProps> = ({ user, onCancel }) => {
  const [namespace, setNamespace] = React.useState(getCloudShellNamespace());
  const [initData, setInitData] = React.useState<TerminalInitData>();
  const [initError, setInitError] = React.useState<string>();

  const [workspace, loaded, loadError] = useCloudShellWorkspace(user, namespace);

  const workspacePhase = workspace?.status?.phase;
  const workspaceName = workspace?.metadata?.name;
  const workspaceNamespace = workspace?.metadata?.namespace;

  const username = user?.metadata?.name;

  // save the namespace once the workspace has loaded
  React.useEffect(() => {
    if (loaded && !loadError) {
      // workspace may be undefined which is ok
      setCloudShellNamespace(workspaceNamespace);
    }
  }, [loaded, loadError, workspaceNamespace]);

  // clear the init data and error if the workspace changes
  React.useEffect(() => {
    setInitData(undefined);
    setInitError(undefined);
  }, [username, workspaceName, workspaceNamespace]);

  // initialize the terminal once it is Running
  React.useEffect(() => {
    let unmounted = false;

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

  // failed to load the workspace
  if (loadError) {
    return (
      <StatusBox loaded={loaded} loadError={loadError} label="OpenShift command line terminal" />
    );
  }

  // failed to init the terminal
  if (initError) {
    return <LoadError message={initError} label="OpenShift command line terminal" />;
  }

  // loading the workspace resource
  if (!loaded) {
    return <TerminalLoadingBox message="" />;
  }

  // waiting for the workspace to start and initialize the terminal
  if (workspaceName && !initData) {
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

  // show the form to let the user create a new workspace
  return (
    <CloudShellSetup
      onCancel={onCancel}
      onSubmit={(ns: string) => {
        setCloudShellNamespace(ns);
        setNamespace(ns);
      }}
    />
  );
};

// For testing
export const InternalCloudShellTerminal = CloudShellTerminal;

const stateToProps = (state: RootState): StateProps => ({
  user: state.UI.get('user'),
});

export default connect(stateToProps)(CloudShellTerminal);

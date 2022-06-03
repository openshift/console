import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBox, LoadError } from '@console/internal/components/utils/status-box';
import { UserKind } from '@console/internal/module/k8s';
import { v1alpha1WorkspaceModel, WorkspaceModel } from '../../models';
import { TerminalInitData, initTerminal, startWorkspace } from './cloud-shell-utils';
import CloudshellExec from './CloudShellExec';
import CloudShellAdminSetup from './setup/CloudShellAdminSetup';
import CloudShellDeveloperSetup from './setup/CloudShellDeveloperSetup';
import TerminalLoadingBox from './TerminalLoadingBox';
import useCloudShellNamespace from './useCloudShellNamespace';
import useCloudShellWorkspace from './useCloudShellWorkspace';

import './CloudShellTerminal.scss';

type CloudShellTerminalProps = {
  onCancel?: () => void;
  isAdmin: boolean;
  isAdminCheckLoading: boolean;
  isv1Alpha2Available: boolean;
  user: UserKind;
  namespace;
  setNamespace;
};

const CloudShellTerminal: React.FC<CloudShellTerminalProps> = ({
  user,
  onCancel,
  namespace,
  setNamespace,
  isAdmin,
  isAdminCheckLoading,
  isv1Alpha2Available,
}) => {
  const [operatorNamespace, namespaceLoadError] = useCloudShellNamespace();
  const [initData, setInitData] = React.useState<TerminalInitData>();
  const [initError, setInitError] = React.useState<string>();
  const workspaceModel = !isv1Alpha2Available ? v1alpha1WorkspaceModel : WorkspaceModel;
  const [workspace, loaded, loadError] = useCloudShellWorkspace(
    user,
    isAdmin,
    workspaceModel,
    namespace,
  );

  const workspacePhase = workspace?.status?.phase;
  const workspaceName = workspace?.metadata?.name;
  const workspaceNamespace = workspace?.metadata?.namespace;

  const username = user?.metadata?.name;

  const { t } = useTranslation();

  const unrecoverableErrorFound = !operatorNamespace && namespaceLoadError;

  // wait until the web terminal is loaded.
  // if the namespace has any problems loading then set the terminal into an unrecoverable state
  React.useEffect(() => {
    if (namespaceLoadError) {
      setInitError(namespaceLoadError);
    }
  }, [namespaceLoadError]);

  // start the workspace if no unrecoverable errors were found
  React.useEffect(() => {
    if (
      operatorNamespace &&
      !unrecoverableErrorFound &&
      workspace?.spec &&
      !workspace.spec.started
    ) {
      startWorkspace(workspace);
    }
    // Run this effect if the workspace name or namespace changes.
    // This effect should only be run once per workspace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    operatorNamespace,
    unrecoverableErrorFound,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    workspace?.metadata?.name,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    workspace?.metadata?.namespace,
  ]);

  // save the namespace once the workspace has loaded
  React.useEffect(() => {
    if (loaded && !loadError) {
      // workspace may be undefined which is ok
      setNamespace(workspaceNamespace);
    }
  }, [loaded, loadError, workspaceNamespace, setNamespace]);

  // clear the init data and error if the workspace changes and if the loading process isn't in an unrecoverable state
  React.useEffect(() => {
    if (!unrecoverableErrorFound) {
      setInitData(undefined);
      setInitError(undefined);
    }
  }, [unrecoverableErrorFound, username, workspaceName, workspaceNamespace]);

  // initialize the terminal once it is Running
  React.useEffect(() => {
    let unmounted = false;
    const defaultError = t('console-app~Failed to connect to your OpenShift command line terminal');

    if (workspacePhase === 'Running') {
      initTerminal(username, workspaceName, workspaceNamespace)
        .then((res: TerminalInitData) => {
          if (!unmounted) setInitData(res);
        })
        .catch((e) => {
          if (!unmounted) {
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

    // handle devWorkspace CR Failed state
    if (workspacePhase === 'Failed') {
      setInitError(defaultError);
    }

    return () => {
      unmounted = true;
    };
  }, [username, workspaceName, workspaceNamespace, workspacePhase, t]);

  // failed to load the workspace
  if (loadError) {
    return (
      <StatusBox
        loaded={loaded}
        loadError={loadError}
        label={t('console-app~OpenShift command line terminal')}
      />
    );
  }

  // failed to init the terminal
  if (initError) {
    return (
      <LoadError message={initError} label={t('console-app~OpenShift command line terminal')} />
    );
  }

  // loading the workspace resource
  if (!loaded || isAdminCheckLoading || !operatorNamespace) {
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
      <CloudshellExec
        workspaceName={workspaceName}
        namespace={workspaceNamespace}
        container={initData.container}
        podname={initData.pod}
        shcommand={initData.cmd || []}
        workspaceModel={workspaceModel}
      />
    );
  }

  if (isAdmin) {
    return (
      <CloudShellAdminSetup
        onInitialize={(ns: string) => {
          setNamespace(ns);
        }}
        workspaceModel={workspaceModel}
        operatorNamespace={operatorNamespace}
      />
    );
  }

  // show the form to let the user create a new workspace
  return (
    <CloudShellDeveloperSetup
      workspaceModel={workspaceModel}
      onCancel={onCancel}
      onSubmit={(ns: string) => {
        setNamespace(ns);
      }}
      operatorNamespace={operatorNamespace}
    />
  );
};

export default CloudShellTerminal;

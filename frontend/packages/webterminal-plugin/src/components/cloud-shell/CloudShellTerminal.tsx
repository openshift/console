import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { getUser } from '@console/dynamic-plugin-sdk';
import { useAccessReview2 } from '@console/internal/components/utils/rbac';
import { StatusBox, LoadError } from '@console/internal/components/utils/status-box';
import { UserInfo } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import {
  useFlag,
  withUserSettingsCompatibility,
  WithUserSettingsCompatibilityProps,
} from '@console/shared';
import { v1alpha1WorkspaceModel, WorkspaceModel } from '../../../models';
import { FLAG_V1ALPHA2DEVWORKSPACE } from '../../const';
import {
  TerminalInitData,
  initTerminal,
  startWorkspace,
  CLOUD_SHELL_PHASE,
} from './cloud-shell-utils';
import CloudshellExec from './CloudShellExec';
import { CLOUD_SHELL_NAMESPACE, CLOUD_SHELL_NAMESPACE_CONFIG_STORAGE_KEY } from './const';
import CloudShellAdminSetup from './setup/CloudShellAdminSetup';
import CloudShellDeveloperSetup from './setup/CloudShellDeveloperSetup';
import TerminalLoadingBox from './TerminalLoadingBox';
import useCloudShellNamespace from './useCloudShellNamespace';
import useCloudShellWorkspace from './useCloudShellWorkspace';

import './CloudShellTerminal.scss';

type StateProps = {
  user: UserInfo;
};

type Props = {
  onCancel?: () => void;
  terminalNumber?: number;
  setWorkspaceName?: (name: string, terminalNumber: number) => void;
  setWorkspaceNamespace?: (namespace: string, terminalNumber: number) => void;
};

type CloudShellTerminalProps = StateProps & Props;

const CloudShellTerminal: React.FC<
  CloudShellTerminalProps & WithUserSettingsCompatibilityProps<string>
> = ({
  user,
  onCancel,
  userSettingState: namespace,
  setUserSettingState: setNamespace,
  terminalNumber,
  setWorkspaceName,
  setWorkspaceNamespace,
}) => {
  const [operatorNamespace, namespaceLoadError] = useCloudShellNamespace();
  const [initData, setInitData] = React.useState<TerminalInitData>();
  const [initError, setInitError] = React.useState<string>();
  const [isAdmin, isAdminCheckLoading] = useAccessReview2({
    namespace: 'openshift-terminal',
    verb: 'create',
    resource: 'pods',
  });
  const isv1Alpha2Available = useFlag(FLAG_V1ALPHA2DEVWORKSPACE);
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
  const workspaceId = workspace?.metadata?.uid;

  terminalNumber &&
    workspaceName &&
    setWorkspaceName &&
    setWorkspaceName(workspaceName, terminalNumber);

  terminalNumber &&
    workspaceNamespace &&
    setWorkspaceNamespace &&
    setWorkspaceNamespace(workspaceNamespace, terminalNumber);

  const username = user?.username;

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
    const defaultError = t(
      'webterminal-plugin~Failed to connect to your OpenShift command line terminal',
    );

    if (workspacePhase === CLOUD_SHELL_PHASE.RUNNING) {
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
    if (workspacePhase === CLOUD_SHELL_PHASE.FAILED) {
      setInitError(defaultError);
    }

    if (workspacePhase === CLOUD_SHELL_PHASE.STARTING) {
      setInitError(null);
    }

    return () => {
      unmounted = true;
    };
  }, [username, workspaceName, workspaceNamespace, workspacePhase, t, terminalNumber]);

  // failed to load the workspace
  if (loadError) {
    return (
      <StatusBox
        loaded={loaded}
        loadError={loadError}
        label={t('webterminal-plugin~OpenShift command line terminal')}
      />
    );
  }

  // failed to init the terminal
  if (initError) {
    return (
      <LoadError
        message={initError}
        label={t('webterminal-plugin~OpenShift command line terminal')}
      />
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
        workspaceId={workspaceId}
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
        workspaceModel={workspaceModel}
        onCancel={onCancel}
        onSubmit={(ns: string) => {
          setNamespace(ns);
        }}
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

// For testing
export const InternalCloudShellTerminal = CloudShellTerminal;

const stateToProps = (state: RootState): StateProps => ({
  user: getUser(state),
});

export default connect<StateProps, null, Props>(stateToProps)(
  withUserSettingsCompatibility<
    CloudShellTerminalProps & WithUserSettingsCompatibilityProps<string>,
    string
  >(
    CLOUD_SHELL_NAMESPACE_CONFIG_STORAGE_KEY,
    CLOUD_SHELL_NAMESPACE,
  )(CloudShellTerminal),
);

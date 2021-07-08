import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useAccessReview2 } from '@console/internal/components/utils/rbac';
import { StatusBox, LoadError } from '@console/internal/components/utils/status-box';
import { UserKind } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import {
  useFlag,
  withUserSettingsCompatibility,
  WithUserSettingsCompatibilityProps,
} from '@console/shared';
import { FLAG_V1ALPHA2DEVWORKSPACE } from '../../consts';
import { v1alpha1WorkspaceModel, WorkspaceModel } from '../../models';
import { TerminalInitData, initTerminal } from './cloud-shell-utils';
import CloudshellExec from './CloudShellExec';
import { CLOUD_SHELL_NAMESPACE, CLOUD_SHELL_NAMESPACE_CONFIG_STORAGE_KEY } from './const';
import CloudShellAdminSetup from './setup/CloudShellAdminSetup';
import CloudShellDeveloperSetup from './setup/CloudShellDeveloperSetup';
import TerminalLoadingBox from './TerminalLoadingBox';
import useCloudShellWorkspace from './useCloudShellWorkspace';

import './CloudShellTerminal.scss';

type StateProps = {
  user: UserKind;
};

type Props = {
  onCancel?: () => void;
};

type CloudShellTerminalProps = StateProps & Props;

const CloudShellTerminal: React.FC<CloudShellTerminalProps &
  WithUserSettingsCompatibilityProps<string>> = ({
  user,
  onCancel,
  userSettingState: namespace,
  setUserSettingState: setNamespace,
}) => {
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

  const username = user?.metadata?.name;

  const { t } = useTranslation();

  // save the namespace once the workspace has loaded
  React.useEffect(() => {
    if (loaded && !loadError) {
      // workspace may be undefined which is ok
      setNamespace(workspaceNamespace);
    }
  }, [loaded, loadError, workspaceNamespace, setNamespace]);

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
            const defaultError = t(
              'console-app~Failed to connect to your OpenShift command line terminal',
            );
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
  if (!loaded || isAdminCheckLoading) {
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
    />
  );
};

// For testing
export const InternalCloudShellTerminal = CloudShellTerminal;

const stateToProps = (state: RootState): StateProps => ({
  user: state.UI.get('user'),
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

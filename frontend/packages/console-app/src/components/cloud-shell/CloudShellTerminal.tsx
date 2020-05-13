import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { LoadingBox, StatusBox } from '@console/internal/components/utils/status-box';
import { WorkspaceModel } from '../../models';
import { CloudExec } from './CloudShellExec2';
import {
  CLOUD_SHELL_LABEL,
  CLOUD_SHELL_USER_ANNOTATION,
  CloudShellResource,
  makeTerminalInitCalls,
} from './cloud-shell-utils';
import CloudShellSetup from './setup/CloudShellSetup';

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
  const [workSpacePod, setWorkspacePod] = React.useState<any>(null);
  const [namespace, setNamespace] = React.useState<string>(null);
  const [apiError, setApiError] = React.useState<string>(null);
  const [initializing, setInitializing] = React.useState<Boolean>(false);

  React.useEffect(() => {
    if (Array.isArray(data)) {
      const workspace = data.find(
        (d) => d?.metadata?.annotations?.[CLOUD_SHELL_USER_ANNOTATION] === username,
      );

      if (workspace) {
        const running = workspace.status?.phase === 'Running';
        if (!initializing && !workSpacePod) {
          setInitializing(true);
          console.log('setting init');
        }
        if (!namespace) {
          setNamespace(workspace.metadata.namespace);
        }
        if (running && !apiError && !workSpacePod) {
          setNamespace(workspace.metadata.namespace);
          makeTerminalInitCalls(username, workspace.metadata.name, workspace.metadata.namespace)
            .then((res) => {
              setWorkspacePod({ pod: res.pod, container: res.container, command: res.cmd });
              apiError && setApiError(null);
              initializing && setInitializing(false);
            })
            .catch(() => {
              setApiError("Couldn't reach API");
              initializing && setInitializing(false);
            });
        }
      }
    }
  }, [data]);

  console.log('render', initializing, workSpacePod);

  if (loadError) {
    return (
      <StatusBox loaded={loaded} loadError={loadError} label="OpenShift command line terminal" />
    );
  }

  if (!loaded) {
    return <LoadingBox />;
  }

  if (!workSpacePod && initializing) {
    return (
      <div style={{ background: 'black', color: '#3385ff', height: '100%', width: '100%' }}>
        <LoadingBox message="Connecting you to OpenShift command line terminal" />;
      </div>
    );
  }

  if (apiError) return <h1>{apiError}</h1>;

  if (workSpacePod) {
    return (
      <CloudExec
        container={workSpacePod.container}
        podname={workSpacePod.pod}
        namespace={namespace}
        command={workSpacePod.command}
      />
    );
  }
  return <CloudShellSetup onCancel={onCancel} />;
};

const stateToProps = (state: RootState): StateProps => ({
  username: state.UI.get('user')?.metadata?.name || '',
});

// exposed for testing
export const InternalCloudShellTerminal = CloudShellTerminal;

export default connect(stateToProps)(CloudShellTerminal);

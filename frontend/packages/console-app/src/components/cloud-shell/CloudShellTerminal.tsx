import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { LoadingBox, StatusBox } from '@console/internal/components/utils/status-box';
import { WorkspaceModel } from '../../models';
import CloudShellTerminalFrame from './CloudShellTerminalFrame';
import {
  CLOUD_SHELL_LABEL,
  CLOUD_SHELL_USER_ANNOTATION,
  fetchPodList,
  CloudShellResource,
  makeTerminalConfigCalls,
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

  const [workSpacePod, setWorkspacePod] = React.useState();
  if (loadError) {
    return (
      <StatusBox loaded={loaded} loadError={loadError} label="OpenShift command line terminal" />
    );
  }

  if (!loaded) {
    return <LoadingBox />;
  }

  if (Array.isArray(data)) {
    const workspace = data.find(
      (d) => d?.metadata?.annotations?.[CLOUD_SHELL_USER_ANNOTATION] === username,
    );
    if (workspace) {
      const running = workspace.status?.phase === 'Running';
      if (running && !workSpacePod) {
        // making async config calls to terminal API
        try {
          makeTerminalConfigCalls(workspace);
        } catch (e) {
          // shrug
        }
        // Fetching Pod lyst async.
        fetchPodList(workspace.metadata.namespace, workspace.metadata.name).then((res) => {
          setWorkspacePod(res[0]);
        });
      }
      return <CloudShellTerminalFrame loading={!running} obj={workSpacePod} />;
    }
  }

  return <CloudShellSetup onCancel={onCancel} />;
};

const stateToProps = (state: RootState): StateProps => ({
  username: state.UI.get('user')?.metadata?.name || '',
});

// exposed for testing
export const InternalCloudShellTerminal = CloudShellTerminal;

export default connect(stateToProps)(CloudShellTerminal);

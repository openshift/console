import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { LoadingBox, StatusBox } from '@console/internal/components/utils/status-box';
import { WorkspaceModel } from '../../models';
import {
  CLOUD_SHELL_LABEL,
  CLOUD_SHELL_USER_ANNOTATION,
  CloudShellResource,
} from './cloud-shell-utils';
import CloudShellSetup from './setup/CloudShellSetup';

import { CloudShellTerminalTest } from './CloudShellTerminalTest';

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
      // // http://workspace9d13cc198439437b-cloud-shell-4444.apps-crc.testing/static/
      // const path = workspace.status?.ideUrl.replace(/^\w+(:\/\/)?[\w-.]+\/?/, '');
      // const proxyUrl = `/api/terminal/${workspace.metadata.namespace}/${workspace.metadata.name}/${path}`;
      // return <CloudShellTerminalFrame loading={!running} url={proxyUrl} />;

      return (
        <div style={{ height: '100%' }}>
          <CloudShellTerminalTest
            running={running}
            name={workspace.metadata.name}
            namespace={workspace.metadata.namespace}
          />
        </div>
      );
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

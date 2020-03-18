import * as React from 'react';
import { referenceForModel, k8sCreate } from '@console/internal/module/k8s';
import { Firehose, FirehoseResource, FirehoseResult } from '@console/internal/components/utils';

import { WorkspaceModel } from '../../models';
import { newCloudShellWorkSpace, CloudShellResource } from './utils/cloudshell-resource';
import CloudShellTerminalFrame from './CloudShellTerminalFrame';

// TODO use proper namespace and resource name
const namespace = 'che-workspace-controller';
const name = 'cloudshell-userid';

const Inner: React.FC<{ cloudShell?: FirehoseResult<CloudShellResource[]> }> = ({ cloudShell }) => {
  const loaded = cloudShell?.loaded;
  const data = cloudShell?.data?.[0];
  React.useEffect(() => {
    if (loaded && data == null) {
      k8sCreate(WorkspaceModel, newCloudShellWorkSpace(name, namespace));
    }
  }, [loaded, data]);

  const running = data?.status?.phase === 'Running';
  const url = data?.status?.ideUrl;
  return <CloudShellTerminalFrame loading={!running} url={url} />;
};

const CloudShellTerminal: React.FC = () => {
  const resources: FirehoseResource[] = [
    {
      kind: referenceForModel(WorkspaceModel),
      namespace,
      prop: `cloudShell`,
      isList: true,
      fieldSelector: `metadata.name=${name}`,
    },
  ];

  return (
    <Firehose resources={resources}>
      <Inner />
    </Firehose>
  );
};

export default CloudShellTerminal;

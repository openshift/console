import { Map as ImmutableMap } from 'immutable';
import { NetworkAttachmentDefinitionModel } from '..';

export const NetworkAttachmentDefinitionsYAMLTemplates = ImmutableMap().setIn(
  ['default'],
  `
apiVersion: ${NetworkAttachmentDefinitionModel.apiGroup}/${
    NetworkAttachmentDefinitionModel.apiVersion
  }
kind: ${NetworkAttachmentDefinitionModel.kind}
metadata:
  name: example
spec:
  config: '{
    "cniVersion": "0.3.1",
    "name": "a-bridge-network",
    "type": "bridge",
    "bridge": "br0",
    "isGateway": true,
    "ipam": {
      "type": "host-local",
      "subnet": "192.168.5.0/24",
      "dataDir": "/mnt/cluster-ipam"
    }
  }'
`,
);

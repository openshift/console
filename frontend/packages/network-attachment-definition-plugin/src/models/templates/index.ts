import { Map as ImmutableMap } from 'immutable';
import { NetworkAttachmentDefinitionModel } from '..';

export const NetworkAttachmentDefinitionsYAMLTemplates = ImmutableMap().setIn(
  ['default'],
  `
apiVersion: ${NetworkAttachmentDefinitionModel.apiGroup}/${NetworkAttachmentDefinitionModel.apiVersion}
kind: ${NetworkAttachmentDefinitionModel.kind}
metadata:
  name: example
spec:
  config: '{}'
`,
);

export const defaultYamlTemplate = NetworkAttachmentDefinitionsYAMLTemplates.getIn(['default']);

import { Map as ImmutableMap } from 'immutable';
import { FooBarModel } from './models';

export const yamlTemplates = ImmutableMap().setIn(
  [FooBarModel, 'default'],
  `
apiVersion: ${FooBarModel.apiGroup}/${FooBarModel.apiVersion}
kind: ${FooBarModel.kind}
metadata:
  name: example
  namespace: default
`,
);

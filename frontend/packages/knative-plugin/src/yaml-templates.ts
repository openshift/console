import { Map as ImmutableMap } from 'immutable';
import { ServiceModel } from './models';

export const yamlTemplates = ImmutableMap().setIn(
  [ServiceModel, 'default'],
  `
apiVersion: ${ServiceModel.apiGroup}/${ServiceModel.apiVersion}
kind: ${ServiceModel.kind}
metadata:
  name: sample
  namespace: default
spec:
  runLatest:
    configuration:
      revisionTemplate:
        spec:
          container:
            image: openshift/hello-openshift
`,
);

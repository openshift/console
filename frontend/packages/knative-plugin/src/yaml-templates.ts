import { Map as ImmutableMap } from 'immutable';
import { ServiceModelAlpha, ServiceModelBeta } from './models';

export const yamlTemplatesAlpha = ImmutableMap().setIn(
  [ServiceModelAlpha, 'default'],
  `
apiVersion: ${ServiceModelAlpha.apiGroup}/${ServiceModelAlpha.apiVersion}
kind: ${ServiceModelAlpha.kind}
metadata:
  name: sample
  namespace: default
spec:
  template:
    spec:
      containers:
      - image: openshift/hello-openshift
`,
);

export const yamlTemplatesBeta = ImmutableMap().setIn(
  [ServiceModelBeta, 'default'],
  `
apiVersion: ${ServiceModelBeta.apiGroup}/${ServiceModelBeta.apiVersion}
kind: ${ServiceModelBeta.kind}
metadata:
  name: sample
  namespace: default
spec:
  template:
    spec:
      containers:
      - image: openshift/hello-openshift
`,
);

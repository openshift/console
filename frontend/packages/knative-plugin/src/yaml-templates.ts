import { ServiceModel } from './models';

export const defaultYamlTemplate = `
apiVersion: ${ServiceModel.apiGroup}/${ServiceModel.apiVersion}
kind: ${ServiceModel.kind}
metadata:
  name: sample
  namespace: default
spec:
  template:
    spec:
      containers:
      - image: openshift/hello-openshift
`;

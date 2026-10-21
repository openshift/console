import { ServiceModel } from './models';

export const defaultYamlTemplate = `
apiVersion: ${ServiceModel.apiGroup}/${ServiceModel.apiVersion}
kind: ${ServiceModel.kind}
metadata:
  name: showcase
  namespace: default
spec:
  template:
    spec:
      containers:
      - image: quay.io/openshift-knative/showcase
`;

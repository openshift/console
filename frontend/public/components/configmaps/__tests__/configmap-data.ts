import { ConfigMap } from '../types';

export const sampleConfigMap: ConfigMap = {
  kind: 'ConfigMap',
  apiVersion: 'v1',
  metadata: {
    name: 'cfg',
    namespace: 'test-ns',
    uid: '60c568d2-ad3d-4769-b9c7-f783f80e7448',
    resourceVersion: '90045',
  },
  data: {
    key: 'value',
  },
};
export const sampleConfigMapYaml: string = `apiVersion: v1
kind: ConfigMap
metadata:
  name: cfg
  namespace: ''
data:
  key: value
binaryData: {}
`;

export const defaultConfigMapYaml: string = `apiVersion: v1
kind: ConfigMap
metadata:
  name: ''
  namespace: ''
data: {}
binaryData: {}
immutable: false
`;

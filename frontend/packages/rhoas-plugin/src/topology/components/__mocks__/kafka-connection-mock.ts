import { KafkaConnection } from '../../../utils/rhoas-types';

export const mockKafkaConnection: KafkaConnection = {
  apiVersion: 'rhoas.redhat.com/v1alpha1',
  kind: 'KafkaConnection',
  metadata: {
    creationTimestamp: '2021-06-15T11:16:05Z',
    finalizers: ['kafkaconnections.rhoas.redhat.com/finalizer'],
    generation: 1,
    name: 'example',
    namespace: 'default',
    resourceVersion: '481367',
    uid: 'f41f7577-2eaa-428a-a600-04657cb0e9dc',
  },
  spec: {
    accessTokenSecretName: 'accessTokenName',
    credentials: {
      serviceAccountSecretName: 'RH-service-account-secret',
    },
  },
  status: {
    bootstrapServerHost: 'bootstrapServerHost',
    conditions: [
      {
        message: '',
        reason: '',
        status: 'True',
        type: 'AcccesTokenSecretValid',
      },
    ],
    metadata: {},
  },
};

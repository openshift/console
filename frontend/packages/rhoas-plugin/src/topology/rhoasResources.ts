import { referenceForModel } from '@console/internal/module/k8s';
import { KafkaConnectionModel } from '../models';

export const getRhoasWatchedResources = (namespace: string) => {
  return {
    kafkaConnections: {
      isList: true,
      kind: referenceForModel(KafkaConnectionModel),
      namespace,
      optional: true,
    },
  };
};

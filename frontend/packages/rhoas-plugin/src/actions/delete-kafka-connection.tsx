import { k8sKill } from '@console/internal/module/k8s';
import { KebabOption } from '@console/internal/components/utils';
import { KafkaConnectionModel } from '../models/rhoas';

export const deleteKafkaConnection = (name: string, namespace: string): KebabOption => {
  return {
    labelKey: 'rhoas-plugin~Delete Kafka Connection',
    callback: async () => {
      await k8sKill(KafkaConnectionModel, {
        metadata: {
          name,
          namespace,
        },
      });
    },
  };
};

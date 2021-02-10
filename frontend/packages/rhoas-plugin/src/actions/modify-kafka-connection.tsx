import { k8sKill } from '@console/internal/module/k8s';
import { ManagedKafkaConnectionModel } from '../models/rhoas';

export const deleteManagedKafkaConnection = (name: string, namespace: string) => {
  return {
    labelKey: 'rhoas-plugin~Delete Kafka Connection',
    callback: async () => {
      await k8sKill(ManagedKafkaConnectionModel, {
        metadata: {
          name,
          namespace,
        },
      });
    },
  };
};

import { k8sKillByName } from '@console/internal/module/k8s';
import { NamespaceModel } from '@console/internal/models';

export const deleteManagedKafkaConnection = (name: string, namespace: string) => {
  console.log('dont think we will need namespace' + namespace);
  return {
    labelKey: 'Delete Kafka Connection',
    callback: () => {
      k8sKillByName(NamespaceModel, name);
    }
  };
};

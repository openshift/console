import { deleteResourceModal } from '@console/shared';
import { coFetchJSON } from '@console/internal/co-fetch';
import { history } from '@console/internal/components/utils';
import { k8sKillByName } from '@console/internal/module/k8s';
import { NamespaceModel } from '@console/internal/models';

export const deleteManagedKafkaConnection = (name: string, namespace: string, redirect?: string) => {
  console.log('does it make it here' + name + namespace )

  const deleteNamespace = async () => {
    try {
      await k8sKillByName(NamespaceModel, namespace);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Could not delete node terminal debug namespace.', e);
    }
  };

  return {
    labelKey: 'Delete Kafka Connection',
    deleteNamespace();
    // callback: () => {
    //   deleteResourceModal({
    //     blocking: true,
    //     resourceName: 'test',
    //     resourceType: 'Helm Release',
    //     // t('helm-plugin~Uninstall')
    //     actionLabelKey: 'helm-plugin~Uninstall',
    //     redirect,
    //     onSubmit: () => {
    //       deleteNamespace();
    //       // return coFetchJSON.delete(
    //       //   `/api/helm/release?name=${releaseName}&ns=${namespace}`,
    //       //   null,
    //       //   null,
    //       //   -1,
    //       // );
    //     },
    //   });
    // },
  };
};

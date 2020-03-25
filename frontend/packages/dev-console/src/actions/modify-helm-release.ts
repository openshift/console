import { coFetchJSON } from '@console/internal/co-fetch';
import { deleteResourceModal } from '../components/modals';

export const deleteHelmRelease = (releaseName: string, namespace: string, redirect?: string) => {
  return {
    label: 'Delete Helm Release',
    callback: () => {
      deleteResourceModal({
        blocking: true,
        resourceName: releaseName,
        resourceType: 'Helm Release',
        redirect,
        onSubmit: () => {
          return coFetchJSON.delete(`/api/helm/release?name=${releaseName}&ns=${namespace}`);
        },
      });
    },
  };
};

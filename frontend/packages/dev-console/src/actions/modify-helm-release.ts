import { coFetchJSON } from '@console/internal/co-fetch';
import { history } from '@console/internal/components/utils';
import { deleteResourceModal } from '../components/modals';

export const deleteHelmRelease = (releaseName: string, namespace: string, redirect?: string) => {
  return {
    label: 'Uninstall Helm Release',
    callback: () => {
      deleteResourceModal({
        blocking: true,
        resourceName: releaseName,
        resourceType: 'Helm Release',
        actionLabel: 'Uninstall',
        redirect,
        onSubmit: () => {
          return coFetchJSON.delete(`/api/helm/release?name=${releaseName}&ns=${namespace}`);
        },
      });
    },
  };
};

export const upgradeHelmRelease = (releaseName: string, namespace: string) => ({
  label: 'Upgrade Helm Release',
  callback: () => {
    history.push(`/helm-releases/ns/${namespace}/${releaseName}/upgrade`);
  },
});

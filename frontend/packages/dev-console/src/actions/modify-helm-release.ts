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

export const upgradeHelmRelease = (
  releaseName: string,
  namespace: string,
  actionOrigin: string,
) => ({
  label: 'Upgrade',
  callback: () => {
    history.push(
      `/helm-releases/ns/${namespace}/${releaseName}/upgrade?actionOrigin=${actionOrigin}`,
    );
  },
});

export const rollbackHelmRelease = (
  releaseName: string,
  namespace: string,
  actionOrigin: string,
) => ({
  label: 'Rollback',
  callback: () => {
    history.push(
      `/helm-releases/ns/${namespace}/${releaseName}/rollback?actionOrigin=${actionOrigin}`,
    );
  },
});

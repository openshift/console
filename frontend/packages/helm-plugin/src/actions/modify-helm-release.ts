import { coFetchJSON } from '@console/internal/co-fetch';
import { history } from '@console/internal/components/utils';
import { deleteResourceModal } from '@console/shared';

export const deleteHelmRelease = (releaseName: string, namespace: string, redirect?: string) => {
  return {
    // t('helm-plugin~Uninstall Helm Release')
    labelKey: 'helm-plugin~Uninstall Helm Release',
    callback: () => {
      deleteResourceModal({
        blocking: true,
        resourceName: releaseName,
        resourceType: 'Helm Release',
        // t('helm-plugin~Uninstall')
        actionLabelKey: 'helm-plugin~Uninstall',
        redirect,
        onSubmit: () => {
          return coFetchJSON.delete(
            `/api/helm/release?name=${releaseName}&ns=${namespace}`,
            null,
            null,
            -1,
          );
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
  // t('helm-plugin~Upgrade')
  labelKey: 'helm-plugin~Upgrade',
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
  // t('helm-plugin~Rollback')
  labelKey: 'helm-plugin~Rollback',
  callback: () => {
    history.push(
      `/helm-releases/ns/${namespace}/${releaseName}/rollback?actionOrigin=${actionOrigin}`,
    );
  },
});

import i18n from '@console/internal/i18n';
import { coFetchJSON } from '@console/internal/co-fetch';
import { history } from '@console/internal/components/utils';
import { deleteResourceModal } from '../components/modals';

export const deleteHelmRelease = (releaseName: string, namespace: string, redirect?: string) => {
  return {
    label: i18n.t('devconsole~Uninstall Helm Release'),
    callback: () => {
      deleteResourceModal({
        blocking: true,
        resourceName: releaseName,
        resourceType: 'Helm Release',
        actionLabel: 'Uninstall',
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
  label: i18n.t('devconsole~Upgrade'),
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
  label: i18n.t('devconsole~Rollback'),
  callback: () => {
    history.push(
      `/helm-releases/ns/${namespace}/${releaseName}/rollback?actionOrigin=${actionOrigin}`,
    );
  },
});

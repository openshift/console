import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { GettingStartedLink } from '@console/shared/src/components/getting-started';

import { SecretModel } from '@console/internal/models';
import { SecretKind } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { getAlertmanagerConfig } from '@console/internal/components/monitoring/alert-manager-utils';
import { numberOfIncompleteReceivers } from '@console/internal/components/monitoring/alert-manager-config';

const useCanEditAlertManagerConfigSecret = () =>
  useAccessReview({
    group: SecretModel.apiGroup,
    resource: SecretModel.plural,
    namespace: 'openshift-monitoring',
    name: 'alertmanager-main',
    verb: 'patch',
  });

const useAlertManagerConfigSecret = (watch: boolean) =>
  useK8sWatchResource<SecretKind>(
    watch
      ? {
          kind: SecretModel.kind,
          isList: false,
          namespaced: true,
          namespace: 'openshift-monitoring',
          name: 'alertmanager-main',
        }
      : null,
  );

export const useAlertReceiverLink = (): GettingStartedLink | null => {
  const { t } = useTranslation();
  const canEdit = useCanEditAlertManagerConfigSecret();
  const [secret] = useAlertManagerConfigSecret(canEdit);

  const hasIncompleteReceivers = useMemo<boolean>(() => {
    const { config } = getAlertmanagerConfig(secret);
    return config ? numberOfIncompleteReceivers(config) > 0 : false;
  }, [secret]);

  if (canEdit && hasIncompleteReceivers) {
    return {
      key: 'alert-receivers',
      title: t('public~Configure alert receivers'),
      href: '/monitoring/alertmanagerconfig',
    };
  }

  return null;
};

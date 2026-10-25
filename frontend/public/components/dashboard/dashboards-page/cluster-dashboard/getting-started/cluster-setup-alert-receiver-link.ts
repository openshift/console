import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { numberOfIncompleteReceivers } from '@console/internal/components/monitoring/alertmanager/alertmanager-config';
import { getAlertmanagerConfig } from '@console/internal/components/monitoring/alertmanager/alertmanager-utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { SecretModel } from '@console/internal/models';
import type { SecretKind } from '@console/internal/module/k8s';
import type { GettingStartedLink } from '@console/shared/src/components/getting-started/GettingStartedCard';

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
  const { t } = useTranslation('public');
  const canEdit = useCanEditAlertManagerConfigSecret();
  const [secret] = useAlertManagerConfigSecret(canEdit);

  const hasIncompleteReceivers = useMemo<boolean>(() => {
    const { config } = getAlertmanagerConfig(secret);
    return config ? numberOfIncompleteReceivers(config) > 0 : false;
  }, [secret]);

  if (canEdit && hasIncompleteReceivers) {
    return {
      id: 'alert-receivers',
      title: t('Configure alert receivers'),
      href: '/settings/cluster/alertmanagerconfig',
    };
  }

  return null;
};

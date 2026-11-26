import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Action } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import { useAddSecretToWorkloadModalLauncher } from '@console/internal/components/modals/add-secret-to-workload';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import type { SecretKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useSecretsActionsProvider = (resource: SecretKind) => {
  const { t } = useTranslation('console-app');
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const editPath = useMemo(
    () => (kindObj ? `${resourceObjPath(resource, kindObj.kind)}/edit` : undefined),
    [kindObj, resource],
  );

  const commonActions = useCommonResourceActions(kindObj, resource, undefined, editPath);

  const addSecretToWorkloadProps = useMemo(
    () => ({ secretName: resource.metadata?.name, namespace: resource.metadata?.namespace }),
    [resource.metadata?.name, resource.metadata?.namespace],
  );
  const launchAddSecretToWorkload = useAddSecretToWorkloadModalLauncher(addSecretToWorkloadProps);

  const actions = useMemo<Action[]>(
    () => [
      {
        id: 'add-secret-to-workload',
        label: t('Add Secret to workload'),
        cta: () => launchAddSecretToWorkload(),
      },
      ...commonActions,
    ],
    [commonActions, launchAddSecretToWorkload, t],
  );

  return [actions, !inFlight];
};

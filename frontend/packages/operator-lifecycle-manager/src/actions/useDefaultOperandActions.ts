import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { K8S_VERB_DELETE, K8S_VERB_UPDATE } from '@console/dynamic-plugin-sdk/src/api/constants';
import type { Action } from '@console/dynamic-plugin-sdk/src/lib-core';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { referenceFor } from '@console/internal/module/k8s';
import { useDeleteModal } from '@console/shared/src/hooks/useDeleteModal';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { csvNameFromWindow } from '../components/operand/operand-link';
import { ClusterServiceVersionModel } from '../models';

const useDefaultOperandActions = ({ csvName, resource }): [Action[], boolean, any] => {
  const { t } = useTranslation();
  const [k8sModel, inFlight] = useK8sModel(referenceFor(resource));
  const redirectTo =
    resource && k8sModel
      ? `/k8s/ns/${resource.metadata.namespace}/${ClusterServiceVersionModel.plural}/${
          csvName || csvNameFromWindow()
        }/${referenceFor(resource)}`
      : undefined;
  const launchDeleteModal = useDeleteModal(resource, redirectTo);

  const actions = useMemo(
    () =>
      resource && k8sModel
        ? [
            {
              id: 'edit-operand',
              label: t('olm~Edit {{item}}', { item: k8sModel.label }),
              cta: {
                href: k8sModel.namespaced
                  ? `/k8s/ns/${resource.metadata.namespace}/${ClusterServiceVersionModel.plural}/${
                      csvName || csvNameFromWindow()
                    }/${referenceFor(resource)}/${resource.metadata.name}/yaml`
                  : `/k8s/cluster/${referenceFor(resource)}/${resource.metadata.name}/yaml`,
              },
              accessReview: asAccessReview(k8sModel, resource, K8S_VERB_UPDATE),
            },
            {
              id: 'delete-operand',
              label: t('olm~Delete {{item}}', { item: k8sModel.label }),
              cta: launchDeleteModal,
              accessReview: asAccessReview(k8sModel, resource, K8S_VERB_DELETE),
            },
          ]
        : [],
    [csvName, k8sModel, resource, launchDeleteModal, t],
  );

  return useMemo(() => [actions, !inFlight, undefined], [actions, inFlight]);
};

export default useDefaultOperandActions;

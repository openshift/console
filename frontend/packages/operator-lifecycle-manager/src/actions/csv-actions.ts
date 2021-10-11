import i18next from 'i18next';
import { Action, K8sKind } from '@console/dynamic-plugin-sdk/src';
import { deleteModal } from '@console/internal/components/modals';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { csvNameFromWindow } from '../components/operand/operand-link';
import { ClusterServiceVersionModel } from '../models';

export const CSVDefaultActions = {
  Edit: (kindObj: K8sKind, resource: K8sResourceKind, csvName: string): Action => {
    const reference = referenceFor(resource);
    return {
      id: 'edit-csv',
      label: i18next.t('olm~Edit {{item}}', { item: kindObj.label }),
      cta: {
        href: kindObj.namespaced
          ? `/k8s/ns/${resource.metadata.namespace}/${
              ClusterServiceVersionModel.plural
            }/${csvName || csvNameFromWindow()}/${reference}/${resource.metadata.name}/yaml`
          : `/k8s/cluster/${reference}/${resource.metadata.name}/yaml`,
      },
      accessReview: {
        group: kindObj.apiGroup,
        resource: kindObj.plural,
        name: resource.metadata.name,
        namespace: resource.metadata.namespace,
        verb: 'update',
      },
    };
  },
  Delete: (kindObj: K8sKind, resource: K8sResourceKind, csvName: string): Action => {
    return {
      id: 'delete-csv',
      label: i18next.t('olm~Delete {{item}}', { item: kindObj.label }),
      cta: () => {
        deleteModal({
          kindObj,
          resource,
          namespace: resource.metadata.namespace,
          redirectTo: `/k8s/ns/${resource.metadata.namespace}/${
            ClusterServiceVersionModel.plural
          }/${csvName || csvNameFromWindow()}/${referenceFor(resource)}`,
        });
      },
      accessReview: {
        group: kindObj.apiGroup,
        resource: kindObj.plural,
        name: resource.metadata.name,
        namespace: resource.metadata.namespace,
        verb: 'delete',
      },
    };
  },
};

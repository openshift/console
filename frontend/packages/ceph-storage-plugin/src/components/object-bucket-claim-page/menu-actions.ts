import { asAccessReview, Kebab } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { attachDeploymentToOBCModal } from '../modals/attach-deployment-obc-modal';

const attachDeployment = (kind: K8sKind, resource: K8sResourceKind) => ({
  // t('ceph-storage-plugin~Attach to Deployment')
  labelKey: 'ceph-storage-plugin~Attach to Deployment',
  callback: () =>
    attachDeploymentToOBCModal({
      kind,
      resource,
    }),
  accessReview: asAccessReview(kind, resource, 'patch'),
});

export const menuActions = [attachDeployment, ...Kebab.factory.common];

export const menuActionCreator = (kindObj: K8sKind, resource: K8sResourceKind) =>
  menuActions.map((action) => action(kindObj, resource));

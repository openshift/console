import { K8sKind } from '../../module/k8s';

// 추가
export const ApprovalModel: K8sKind = {
  label: 'Approval',
  labelPlural: 'Approvals',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'approvals',
  abbr: 'A',
  kind: 'Approval',
  id: 'approval',
  namespaced: true,
};

export const NamespaceClaimModel: K8sKind = {
  label: 'NamespaceClaim',
  labelPlural: 'NamespaceClaims',
  apiVersion: 'v1',
  apiGroup: 'tmax.io',
  plural: 'namespaceclaims',
  abbr: 'NSC',
  kind: 'NamespaceClaim',
  id: 'namespaceclaim',
  namespaced: true,
};

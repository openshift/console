import { getName, getNamespace } from '@console/shared';
import { K8sKind, TemplateKind } from '@console/internal/module/k8s';
import { asAccessReview, Kebab } from '@console/internal/components/utils';

const vmTemplateEditAction = (kind: K8sKind, obj: TemplateKind) => ({
  label: `Edit VM Template`,
  href: `/k8s/ns/${getNamespace(obj)}/vmtemplates/${getName(obj)}/yaml`,
  accessReview: asAccessReview(kind, obj, 'update'),
});

export const menuActions = [
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  vmTemplateEditAction,
  Kebab.factory.Delete,
];

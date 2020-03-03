import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { getLabel, getName, getNamespace } from '@console/shared/src';
import { LABEL_USED_TEMPLATE_NAME, LABEL_USED_TEMPLATE_NAMESPACE } from '../../constants/vm';
import { TemplateKind } from '@console/internal/module/k8s';

export const getVMTemplateNamespacedName = (
  vm: VMGenericLikeEntityKind,
): { name: string; namespace: string } => {
  const name = getLabel(vm, LABEL_USED_TEMPLATE_NAME);
  const namespace = getLabel(vm, LABEL_USED_TEMPLATE_NAMESPACE);
  return name && namespace ? { name, namespace } : null;
};

export const getVMTemplate = (
  vm: VMGenericLikeEntityKind,
  templates: TemplateKind[],
): TemplateKind => {
  const namespacedName = getVMTemplateNamespacedName(vm);
  return namespacedName
    ? templates.find(
        (template) =>
          getName(template) === namespacedName.name &&
          getNamespace(template) === namespacedName.namespace,
      )
    : undefined;
};

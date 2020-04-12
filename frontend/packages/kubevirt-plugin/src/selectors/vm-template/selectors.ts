import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { getLabel, getName, getNamespace } from '@console/shared/src';
import { LABEL_USED_TEMPLATE_NAME, LABEL_USED_TEMPLATE_NAMESPACE } from '../../constants/vm';
import { TemplateKind, K8sResourceCommon, k8sGet } from '@console/internal/module/k8s';
import { TemplateValidations } from '../../utils/validations/template/template-validations';
import { VMKind } from '../../types/vm';
import { TemplateModel } from '@console/internal/models';

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

export const getTemplateValidationsFromTemplate = (
  vmTemplate: TemplateKind,
): TemplateValidations => {
  const result = vmTemplate?.metadata?.annotations?.validations;

  if (!result) {
    return new TemplateValidations();
  }

  try {
    return new TemplateValidations(JSON.parse(result));
  } catch (e) {
    return new TemplateValidations();
  }
};

export const getTemplateOfVM = async (vm: K8sResourceCommon): Promise<K8sResourceCommon> => {
  const tmpltObj = getVMTemplateNamespacedName(vm as VMKind);
  const template = tmpltObj ? await k8sGet(TemplateModel, tmpltObj.name, tmpltObj.namespace) : null;

  return template;
};

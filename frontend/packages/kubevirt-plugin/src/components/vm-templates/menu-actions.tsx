import { getName, getNamespace } from '@console/shared';
import { K8sKind, TemplateKind } from '@console/internal/module/k8s';
import { asAccessReview, Kebab } from '@console/internal/components/utils';
import { VMWizardName, VMWizardMode } from '../../constants/vm';
import { VirtualMachineModel } from '../../models';
import { getVMWizardCreateLink } from '../../utils/url';

const vmTemplateEditAction = (kind: K8sKind, obj: TemplateKind) => ({
  label: `Edit VM Template`,
  href: `/k8s/ns/${getNamespace(obj)}/vmtemplates/${getName(obj)}/yaml`,
  accessReview: asAccessReview(kind, obj, 'update'),
});

const vmTemplateCreateVMAction = (kind: K8sKind, obj: TemplateKind) => ({
  label: `Create Virtual Machine`,
  href: getVMWizardCreateLink(
    getNamespace(obj),
    VMWizardName.WIZARD,
    VMWizardMode.VM,
    getName(obj),
  ),
  accessReview: { model: VirtualMachineModel, namespace: getNamespace(obj), verb: 'create' },
});

export const menuActions = [
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  vmTemplateEditAction,
  vmTemplateCreateVMAction,
  Kebab.factory.Delete,
];

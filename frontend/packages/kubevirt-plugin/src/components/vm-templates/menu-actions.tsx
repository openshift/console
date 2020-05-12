import { getName, getNamespace } from '@console/shared';
import { K8sKind, TemplateKind } from '@console/internal/module/k8s';
import { asAccessReview, Kebab, KebabOption } from '@console/internal/components/utils';
import { deleteModal } from '@console/internal/components/modals/delete-modal';
import { VMWizardName, VMWizardMode } from '../../constants/vm';
import { VirtualMachineModel } from '../../models';
import { getVMWizardCreateLink } from '../../utils/url';

const vmTemplateEditAction = (kind: K8sKind, obj: TemplateKind) => ({
  label: `Edit Virtual Machine Template`,
  href: `/k8s/ns/${getNamespace(obj)}/vmtemplates/${getName(obj)}/yaml`,
  accessReview: asAccessReview(kind, obj, 'update'),
});

const vmTemplateCreateVMAction = (kind: K8sKind, obj: TemplateKind) => ({
  label: `Create Virtual Machine`,
  href: getVMWizardCreateLink({
    namespace: getNamespace(obj),
    wizardName: VMWizardName.WIZARD,
    mode: VMWizardMode.VM,
    template: getName(obj),
  }),
  accessReview: { model: VirtualMachineModel, namespace: getNamespace(obj), verb: 'create' },
});

export const menuActionDeleteVMTemplate = (
  kindObj: K8sKind,
  vmTempalte: TemplateKind,
): KebabOption => ({
  label: `Delete Virtual Machine Template`,
  callback: () =>
    deleteModal({
      kind: kindObj,
      resource: vmTempalte,
      redirectTo: `/k8s/ns/${getNamespace(vmTempalte)}/virtualization/templates`,
    }),
  accessReview: asAccessReview(kindObj, vmTempalte, 'delete'),
});

export const menuActions = [
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  vmTemplateEditAction,
  vmTemplateCreateVMAction,
  menuActionDeleteVMTemplate,
];

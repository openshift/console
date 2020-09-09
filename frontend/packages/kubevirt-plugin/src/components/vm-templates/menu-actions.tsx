import { getName, getNamespace } from '@console/shared';
import { K8sKind, TemplateKind } from '@console/internal/module/k8s';
import { asAccessReview, Kebab, KebabOption } from '@console/internal/components/utils';
import { VMWizardName, VMWizardMode } from '../../constants/vm';
import { VirtualMachineModel } from '../../models';
import { getVMWizardCreateLink } from '../../utils/url';
import { deleteVMTemplateModal } from '../modals/menu-actions-modals/delete-vm-template-modal';

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
    template: obj,
  }),
  accessReview: { model: VirtualMachineModel, namespace: getNamespace(obj), verb: 'create' },
});

export const menuActionDeleteVMTemplate = (
  kindObj: K8sKind,
  vmTemplate: TemplateKind,
): KebabOption => ({
  label: `Delete Virtual Machine Template`,
  callback: () =>
    deleteVMTemplateModal({
      vmTemplate,
    }),
  accessReview: asAccessReview(kindObj, vmTemplate, 'delete'),
});

export const menuActions = [
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  vmTemplateEditAction,
  vmTemplateCreateVMAction,
  menuActionDeleteVMTemplate,
];

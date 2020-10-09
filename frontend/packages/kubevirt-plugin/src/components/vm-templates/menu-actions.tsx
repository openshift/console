import { getName, getNamespace } from '@console/shared';
import { K8sKind, TemplateKind } from '@console/internal/module/k8s';
import { asAccessReview, Kebab, KebabOption } from '@console/internal/components/utils';
import { VMWizardName, VMWizardMode } from '../../constants/vm';
import { VirtualMachineModel } from '../../models';
import { getVMWizardCreateLink } from '../../utils/url';
import { deleteVMTemplateModal } from '../modals/menu-actions-modals/delete-vm-template-modal';
import { isCommonTemplate } from '../../selectors/vm-template/basic';

type CustomData = {
  togglePin?: (template: TemplateKind) => void;
  isPinned?: boolean;
  namespace?: string;
};

type MenuAction = (kind: K8sKind, vmTemplate: TemplateKind, customData?: CustomData) => KebabOption;

const vmTemplateEditAction: MenuAction = (kind, obj) => ({
  label: `Edit Virtual Machine Template`,
  href: `/k8s/ns/${getNamespace(obj)}/vmtemplates/${getName(obj)}/yaml`,
  accessReview: asAccessReview(kind, obj, 'update'),
});

const newTemplateFromCommon: MenuAction = (kind, vmTemplate, { namespace }) => ({
  label: `Create new Template from`,
  href: getVMWizardCreateLink({
    namespace: namespace || vmTemplate.metadata.namespace,
    wizardName: VMWizardName.WIZARD,
    mode: VMWizardMode.TEMPLATE,
    template: vmTemplate,
  }),
});

const vmTemplateCreateVMAction: MenuAction = (kind, obj) => ({
  label: `Create Virtual Machine`,
  href: getVMWizardCreateLink({
    namespace: getNamespace(obj),
    wizardName: VMWizardName.WIZARD,
    mode: VMWizardMode.VM,
    template: obj,
  }),
  accessReview: asAccessReview(
    VirtualMachineModel,
    { metadata: { namespace: getNamespace(obj) } },
    'create',
  ),
});

export const menuActionDeleteVMTemplate: MenuAction = (kindObj, vmTemplate) => ({
  label: `Delete Virtual Machine Template`,
  callback: () =>
    deleteVMTemplateModal({
      vmTemplate,
    }),
  accessReview: asAccessReview(kindObj, vmTemplate, 'delete'),
});

const pinTemplate: MenuAction = (kindObj, vmTemplate, { togglePin, isPinned }) => ({
  label: isPinned ? 'Unpin template' : 'Pin template',
  callback: () => togglePin(vmTemplate),
});

export const menuActionsCreator = (namespace?: string) => (
  kindObj: K8sKind,
  template: TemplateKind,
  extraResources,
  customData: CustomData,
) => {
  const { togglePin, isPinned } = customData || {};
  const actions = isCommonTemplate(template)
    ? [...(togglePin ? [pinTemplate] : []), newTemplateFromCommon, vmTemplateCreateVMAction]
    : [
        ...(togglePin ? [pinTemplate] : []),
        Kebab.factory.ModifyLabels,
        Kebab.factory.ModifyAnnotations,
        vmTemplateEditAction,
        vmTemplateCreateVMAction,
        menuActionDeleteVMTemplate,
      ];
  return actions.map((a) => a(kindObj, template, { togglePin, isPinned, namespace }));
};

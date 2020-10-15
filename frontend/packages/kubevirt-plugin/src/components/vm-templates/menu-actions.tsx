import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { getName, getNamespace } from '@console/shared';
import { K8sKind, TemplateKind } from '@console/internal/module/k8s';
import { asAccessReview, Kebab, KebabOption } from '@console/internal/components/utils';

import { VMWizardName, VMWizardMode } from '../../constants/vm';
import { VirtualMachineModel } from '../../models';
import { getVMWizardCreateLink } from '../../utils/url';
import { deleteVMTemplateModal } from '../modals/menu-actions-modals/delete-vm-template-modal';
import { TemplateItem } from '../../types/template';
import { isCommonTemplate } from '../../selectors/vm-template/basic';
import { PinnedIcon } from './os-icons';
import { SupportModalFunction } from '../../hooks/use-support-modal';
import { TemplateSourceStatus } from '../../statuses/template/types';
import { createVMAction } from './utils';

type CustomData = {
  togglePin?: (template: TemplateItem) => void;
  pinned?: boolean;
  namespace?: string;
  withSupportModal: SupportModalFunction;
  sourceStatus: TemplateSourceStatus;
  sourceLoaded: boolean;
  sourceLoadError: any;
  withCreate?: boolean;
};

type MenuAction = (kind: K8sKind, vmTemplate: TemplateItem, customData?: CustomData) => KebabOption;

const vmTemplateEditAction: MenuAction = (kind, obj) => ({
  label: `Edit Virtual Machine Template`,
  href: `/k8s/ns/${getNamespace(obj)}/vmtemplates/${getName(obj)}/yaml`,
  accessReview: asAccessReview(kind, obj, 'update'),
});

const newTemplateFromCommon: MenuAction = (kind, vmTemplate, { namespace }) => ({
  label: `Create new Template from`,
  href: getVMWizardCreateLink({
    namespace: namespace || vmTemplate.variants[0].metadata.namespace,
    wizardName: VMWizardName.WIZARD,
    mode: VMWizardMode.TEMPLATE,
    template: vmTemplate.variants[0],
  }),
});

const vmTemplateCreateVMAction: MenuAction = (
  kind,
  obj,
  { withSupportModal, sourceStatus, sourceLoaded, sourceLoadError, withCreate },
) => ({
  label: `Create Virtual Machine`,
  callback: () => withSupportModal(obj, () => createVMAction(obj, sourceStatus)),
  accessReview: asAccessReview(
    VirtualMachineModel,
    { metadata: { namespace: getNamespace(obj) } },
    'create',
  ),
  isDisabled: !sourceLoaded || !!sourceLoadError,
  hidden: !withCreate,
});

export const menuActionDeleteVMTemplate: MenuAction = (kindObj, vmTemplate) => {
  const isDisabled = vmTemplate.isCommon;
  return {
    label: (
      <Stack>
        <StackItem className={isDisabled ? 'text-secondary' : undefined}>Delete Template</StackItem>
        {isDisabled && (
          <StackItem className="text-secondary kv-menu-description">
            Red Hat templates cannot be deleted
          </StackItem>
        )}
      </Stack>
    ),
    isDisabled,
    callback: () =>
      deleteVMTemplateModal({
        vmTemplate: vmTemplate.variants[0],
      }),
    accessReview: isDisabled
      ? undefined
      : asAccessReview(kindObj, vmTemplate.variants[0], 'delete'),
  };
};

const pinTemplate: MenuAction = (kindObj, vmTemplate, { togglePin, pinned }) => ({
  label: (
    <>
      {pinned ? 'Unpin template' : 'Pin template'}
      <PinnedIcon />
    </>
  ),
  callback: () => togglePin(vmTemplate),
});

const isTemplateItem = (template: TemplateItem | TemplateKind): template is TemplateItem =>
  template?.hasOwnProperty('isCommon');

export const menuActionsCreator = (
  kindObj: K8sKind,
  template: TemplateItem | TemplateKind,
  extraResources,
  customData: CustomData,
) => {
  const templateItem: TemplateItem = isTemplateItem(template)
    ? template
    : {
        metadata: { name: template.metadata.name, uid: template.metadata.uid },
        isCommon: isCommonTemplate(template),
        variants: [template],
      };
  const actions = templateItem.isCommon
    ? [vmTemplateCreateVMAction, newTemplateFromCommon, menuActionDeleteVMTemplate]
    : [
        Kebab.factory.ModifyLabels,
        Kebab.factory.ModifyAnnotations,
        vmTemplateEditAction,
        vmTemplateCreateVMAction,
        menuActionDeleteVMTemplate,
      ];

  if (customData?.togglePin) {
    actions.push(pinTemplate);
  }
  return actions.map((a) => a(kindObj, templateItem, customData));
};

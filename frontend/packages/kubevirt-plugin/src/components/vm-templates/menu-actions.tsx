import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, StackItem } from '@patternfly/react-core';
import { getNamespace } from '@console/shared';
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
import { CustomizeSourceFunction } from '../../hooks/use-customize-source-modal';
import {
  TemplateSourceStatus,
  isTemplateSourceError,
  SOURCE_TYPE,
} from '../../statuses/template/types';
import { createVMAction } from './utils';
import { VMKind } from '../../types';
import deleteVMTCustomizationModal from '../modals/menu-actions-modals/DeleteVMTCustomizationModal';

type CustomData = {
  togglePin?: (template: TemplateItem) => void;
  pinned?: boolean;
  namespace?: string;
  withSupportModal: SupportModalFunction;
  sourceStatus: TemplateSourceStatus;
  sourceLoaded: boolean;
  sourceLoadError: any;
  withCreate?: boolean;
  withCustomizeModal: CustomizeSourceFunction;
};

type MenuAction = (kind: K8sKind, vmTemplate: TemplateItem, customData?: CustomData) => KebabOption;

const newTemplateFromCommon: MenuAction = (kind, vmTemplate, { namespace }) => ({
  // t('kubevirt-plugin~Create new Template from')
  labelKey: 'kubevirt-plugin~Create new Template from',
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
  { withSupportModal, sourceStatus, sourceLoaded, sourceLoadError, withCreate, namespace },
) => ({
  // t('kubevirt-plugin~Create Virtual Machine')
  labelKey: 'kubevirt-plugin~Create Virtual Machine',
  callback: () =>
    withSupportModal(obj.variants[0], () =>
      createVMAction(obj.variants[0], sourceStatus, namespace),
    ),
  accessReview: asAccessReview(
    VirtualMachineModel,
    { metadata: { namespace: getNamespace(obj) } },
    'create',
  ),
  isDisabled: !sourceLoaded || !!sourceLoadError,
  hidden: !withCreate,
});

const customizeTemplate: MenuAction = (
  kind,
  obj,
  { sourceStatus, sourceLoaded, sourceLoadError, withCustomizeModal },
) => ({
  // t('kubevirt-plugin~Customize boot source')
  labelKey: 'kubevirt-plugin~Customize boot source',
  callback: () => withCustomizeModal(obj.variants[0]),
  isDisabled:
    !sourceLoaded ||
    !!sourceLoadError ||
    isTemplateSourceError(sourceStatus) ||
    !sourceStatus ||
    sourceStatus.source === SOURCE_TYPE.CONTAINER,
});

const MenuActionDeleteVMTemplateLabelDisabled: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Stack>
      <StackItem className="text-secondary">{t('kubevirt-plugin~Delete Template')}</StackItem>
      <StackItem className="text-secondary kv-menu-description">
        {t('kubevirt-plugin~Red Hat templates cannot be deleted')}
      </StackItem>
    </Stack>
  );
};

const MenuActionDeleteVMTemplateLabel: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Stack>
      <StackItem>{t('kubevirt-plugin~Delete Template')}</StackItem>
    </Stack>
  );
};

export const menuActionDeleteVMTemplate: MenuAction = (kindObj, vmTemplate) => {
  const isDisabled = vmTemplate.isCommon;
  return {
    label: isDisabled ? (
      <MenuActionDeleteVMTemplateLabelDisabled />
    ) : (
      <MenuActionDeleteVMTemplateLabel />
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

const PinTemplateLabel: React.FC<{ pinned: boolean }> = ({ pinned }) => {
  const { t } = useTranslation();
  return (
    <>
      {pinned ? t('kubevirt-plugin~Unfavorite template') : t('kubevirt-plugin~Favorite template')}
      <PinnedIcon />
    </>
  );
};

const pinTemplate: MenuAction = (kindObj, vmTemplate, { togglePin, pinned }) => ({
  label: <PinTemplateLabel pinned={pinned} />,
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
        metadata: {
          name: template.metadata.name,
          uid: template.metadata.uid,
          namespace: template.metadata.namespace,
        },
        isCommon: isCommonTemplate(template),
        variants: [template],
      };
  const actions = templateItem.isCommon
    ? [
        vmTemplateCreateVMAction,
        newTemplateFromCommon,
        customizeTemplate,
        menuActionDeleteVMTemplate,
      ]
    : [
        vmTemplateCreateVMAction,
        Kebab.factory.ModifyLabels,
        Kebab.factory.ModifyAnnotations,
        customizeTemplate,
        menuActionDeleteVMTemplate,
      ];

  if (customData?.togglePin) {
    actions.push(pinTemplate);
  }
  return actions.map((a) => a(kindObj, templateItem, customData));
};

export const customizeTemplateActions = (vm: VMKind): KebabOption[] => [
  {
    // t('kubevirt-plugin~Delete Template')
    labelKey: 'kubevirt-plugin~Delete Template',
    callback: () => deleteVMTCustomizationModal({ vm }),
    accessReview: asAccessReview(VirtualMachineModel, vm, 'delete'),
  },
];

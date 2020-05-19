import { TemplateKind } from '@console/internal/module/k8s';
import { getName, getNamespace, getAnnotations } from '@console/shared/src';
import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import {
  asSimpleSettings,
  getFieldValue,
} from '../../../../components/create-vm-wizard/selectors/vm-settings';
import {
  ANNOTATION_DESCRIPTION,
  ANNOTATION_VALIDATIONS,
  LABEL_USED_TEMPLATE_NAME,
  LABEL_USED_TEMPLATE_NAMESPACE,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_WORKLOAD_LABEL,
  TEMPLATE_VM_DOMAIN_LABEL,
  TEMPLATE_VM_NAME_LABEL,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
  APP,
} from '../../../../constants/vm';
import { MutableVMWrapper } from '../../../wrapper/vm/vm-wrapper';
import { getTemplateOperatingSystems } from '../../../../selectors/vm-template/advanced';
import { MutableVMTemplateWrapper } from '../../../wrapper/vm/vm-template-wrapper';
import { operatingSystemsNative } from '../../../../components/create-vm-wizard/native/consts';
import { concatImmutableLists, immutableListToShallowJS } from '../../../../utils/immutable';
import { CreateVMEnhancedParams } from './types';

export const getOS = ({
  vmSettings,
  iUserTemplates,
  openshiftFlag,
  iCommonTemplates,
}: CreateVMEnhancedParams) => {
  const operatingSystems = openshiftFlag
    ? getTemplateOperatingSystems(
        immutableListToShallowJS<TemplateKind>(
          concatImmutableLists(iUserTemplates, iCommonTemplates),
        ),
      )
    : operatingSystemsNative;

  const osID = getFieldValue(vmSettings, VMSettingsField.OPERATING_SYSTEM);
  return {
    osID,
    osName: (operatingSystems.find(({ id }) => id === osID) || {}).name,
  };
};

export const initializeCommonMetadata = (
  settings: { [key in VMSettingsField]?: any },
  { osID, osName }: { osID: string; osName: string },
  entity: MutableVMWrapper | MutableVMTemplateWrapper,
  template?: TemplateKind,
) => {
  entity.addAnotation(`${TEMPLATE_OS_NAME_ANNOTATION}/${osID}`, osName);

  if (settings[VMSettingsField.DESCRIPTION]) {
    entity.addAnotation(ANNOTATION_DESCRIPTION, settings[VMSettingsField.DESCRIPTION]);
  }

  entity.addLabel(`${TEMPLATE_OS_LABEL}/${osID}`, 'true');
  entity.addLabel(`${TEMPLATE_FLAVOR_LABEL}/${settings[VMSettingsField.FLAVOR]}`, 'true');

  if (settings[VMSettingsField.WORKLOAD_PROFILE]) {
    entity.addLabel(
      `${TEMPLATE_WORKLOAD_LABEL}/${settings[VMSettingsField.WORKLOAD_PROFILE]}`,
      'true',
    );
  }

  if (template) {
    entity.addLabel(LABEL_USED_TEMPLATE_NAME, getName(template));
    entity.addLabel(LABEL_USED_TEMPLATE_NAMESPACE, getNamespace(template));
  }

  return entity;
};

export const initializeCommonVMMetadata = (
  createVMParams: CreateVMEnhancedParams,
  entity: MutableVMWrapper,
) => {
  const settings = asSimpleSettings(createVMParams.vmSettings);
  const name = settings[VMSettingsField.NAME];

  entity.addTemplateLabel(TEMPLATE_VM_NAME_LABEL, name); // for pairing service-vm (like for RDP)

  if (!entity.hasTemplateLabel(TEMPLATE_VM_DOMAIN_LABEL)) {
    entity.addTemplateLabel(TEMPLATE_VM_DOMAIN_LABEL, name);
  }

  if (!entity.hasLabel(APP)) {
    entity.addLabel(APP, name);
  }

  // show metadata inside a VMI
  const { osID } = getOS(createVMParams);

  entity.addTemplateLabel(`${TEMPLATE_OS_LABEL}/${osID}`, 'true');
  entity.addTemplateLabel(`${TEMPLATE_FLAVOR_LABEL}/${settings[VMSettingsField.FLAVOR]}`, 'true');

  if (settings[VMSettingsField.WORKLOAD_PROFILE]) {
    entity.addTemplateLabel(
      `${TEMPLATE_WORKLOAD_LABEL}/${settings[VMSettingsField.WORKLOAD_PROFILE]}`,
      'true',
    );
  }
};

export const initializeCommonTemplateMetadata = (
  entity: MutableVMTemplateWrapper,
  template?: TemplateKind,
) => {
  const validations = getAnnotations(template)?.[ANNOTATION_VALIDATIONS];

  entity.addLabel(TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_VM);
  validations && entity.addAnotation(ANNOTATION_VALIDATIONS, validations);
};

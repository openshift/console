import { TemplateKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared/src';
import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import { asSimpleSettings } from '../../../../components/create-vm-wizard/selectors/vm-settings';
import {
  ANNOTATION_DESCRIPTION,
  LABEL_USED_TEMPLATE_NAME,
  LABEL_USED_TEMPLATE_NAMESPACE,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../../../constants/vm';
import { MutableVMWrapper } from '../../../wrapper/vm/vm-wrapper';
import { getTemplateOperatingSystems } from '../../../../selectors/vm-template/advanced';
import { MutableVMTemplateWrapper } from '../../../wrapper/vm/vm-template-wrapper';
import { CreateVMEnhancedParams } from './types';

export const initializeCommonMetadata = (
  { vmSettings, templates }: CreateVMEnhancedParams,
  entity: MutableVMWrapper | MutableVMTemplateWrapper,
  template: TemplateKind,
) => {
  const settings = asSimpleSettings(vmSettings);
  const operatingSystems = getTemplateOperatingSystems(templates);
  const osID = settings[VMSettingsField.OPERATING_SYSTEM];
  const osName = (operatingSystems.find(({ id }) => id === osID) || {}).name;

  entity.addAnotation(`${TEMPLATE_OS_NAME_ANNOTATION}/${osID}`, osName);

  if (settings[VMSettingsField.DESCRIPTION]) {
    entity.addAnotation(ANNOTATION_DESCRIPTION, settings[VMSettingsField.DESCRIPTION]);
  }

  entity.addLabel(`${TEMPLATE_OS_LABEL}/${osID}`, 'true');
  entity.addLabel(`${TEMPLATE_FLAVOR_LABEL}/${settings[VMSettingsField.FLAVOR]}`, 'true');
  entity.addLabel(
    `${TEMPLATE_WORKLOAD_LABEL}/${settings[VMSettingsField.WORKLOAD_PROFILE]}`,
    'true',
  );

  entity.addLabel(LABEL_USED_TEMPLATE_NAME, getName(template));
  entity.addLabel(LABEL_USED_TEMPLATE_NAMESPACE, getNamespace(template));

  return entity;
};

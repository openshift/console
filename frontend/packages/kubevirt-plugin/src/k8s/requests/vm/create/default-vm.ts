import { DefaultVMLikeEntityParams } from './types';
import { k8sCreate } from '@console/internal/module/k8s';
import { VMTemplateWrapper } from '../../../wrapper/vm/vm-template-wrapper';
import {
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_PARAM_VM_NAME,
} from '../../../../constants/vm';
import { findHighestKeyBySuffixValue, getValueByPrefix } from '../../../../selectors/utils';
import { getAnnotations } from '../../../../selectors/selectors';
import { initializeCommonMetadata, initializeCommonVMMetadata } from './common';
import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import { getFlavor, getWorkloadProfile } from '../../../../selectors/vm';
import { ProcessedTemplatesModel } from '../../../../models/models';
import { selectVM } from '../../../../selectors/vm-template/basic';
import { VMKind } from '../../../../types/vm';
import { resolveDefaultVMTemplate } from './default-template';
import { VMWrapper } from '../../../wrapper/vm/vm-wrapper';

export const resolveDefaultVM = async (params: DefaultVMLikeEntityParams): Promise<VMKind> => {
  const { commonTemplate, name, namespace, baseOSName } = params;
  const template = new VMTemplateWrapper(resolveDefaultVMTemplate(params));

  template.setNamespace(namespace).setParameter(TEMPLATE_PARAM_VM_NAME, name);

  const processedTemplate = await k8sCreate(ProcessedTemplatesModel, template.asResource(), null); // temporary

  const vm = new VMWrapper(selectVM(processedTemplate));
  vm.setNamespace(namespace);

  const osID = findHighestKeyBySuffixValue(
    template.getLabels(),
    `${TEMPLATE_OS_LABEL}/${baseOSName}`,
  );

  const osName = getValueByPrefix(
    getAnnotations(commonTemplate),
    `${TEMPLATE_OS_NAME_ANNOTATION}/${osID}`,
  );

  const settings = {
    [VMSettingsField.NAME]: name,
    [VMSettingsField.DESCRIPTION]: 'VM example',
    [VMSettingsField.FLAVOR]: getFlavor(commonTemplate),
    [VMSettingsField.WORKLOAD_PROFILE]: getWorkloadProfile(commonTemplate),
    [VMSettingsField.TEMPLATE_PROVIDER]: null,
    osID,
    osName,
  };

  initializeCommonMetadata(settings, vm, commonTemplate);
  initializeCommonVMMetadata(settings, vm);

  return vm.asResource();
};

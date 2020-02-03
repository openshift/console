import { TemplateModel } from '@console/internal/models';
import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import { getStorageClassConfigMap } from '../../config-map/storage-class';
import {
  asSimpleSettings,
  getFieldValue,
} from '../../../../components/create-vm-wizard/selectors/vm-settings';
import {
  MutableVMTemplateWrapper,
  VMTemplateWrapper,
} from '../../../wrapper/vm/vm-template-wrapper';
import {
  TEMPLATE_PARAM_VM_NAME,
  TEMPLATE_PARAM_VM_NAME_DESC,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
} from '../../../../constants/vm';
import { DataVolumeModel, VirtualMachineModel } from '../../../../models';
import { MutableDataVolumeWrapper } from '../../../wrapper/vm/data-volume-wrapper';
import { buildOwnerReference } from '../../../../utils';
import { MutableVMWrapper } from '../../../wrapper/vm/vm-wrapper';
import { ProcessedTemplatesModel } from '../../../../models/models';
import { toShallowJS } from '../../../../utils/immutable';
import { iGetRelevantTemplate } from '../../../../selectors/immutable/template/combined';
import { CreateVMEnhancedParams, CreateVMParams } from './types';
import { initializeVM } from './initialize-vm';
import { initializeCommonMetadata, initializeCommonVMMetadata } from './common';
import { selectVM } from '../../../../selectors/vm-template/basic';

export const getInitializedVMTemplate = (params: CreateVMEnhancedParams) => {
  const { vmSettings, iCommonTemplates, iUserTemplates } = params;
  const settings = asSimpleSettings(vmSettings);

  const temp = toShallowJS(
    iGetRelevantTemplate(iUserTemplates, iCommonTemplates, {
      userTemplateName: settings[VMSettingsField.USER_TEMPLATE],
      workload: settings[VMSettingsField.WORKLOAD_PROFILE],
      flavor: settings[VMSettingsField.FLAVOR],
      os: settings[VMSettingsField.OPERATING_SYSTEM],
    }),
  );

  if (!temp) {
    return {};
  }

  const template = new MutableVMTemplateWrapper(temp, { copy: true });

  template.setModel(TemplateModel); // make sure api version is correct

  const { storages } = initializeVM(params, template.getMutableVM());

  return { template, storages };
};

export const createVMTemplate = async (params: CreateVMParams) => {
  const { enhancedK8sMethods, namespace, vmSettings } = params;
  const { k8sGet, k8sCreate, getActualState } = enhancedK8sMethods;
  const settings = asSimpleSettings(vmSettings);

  const storageClassConfigMap = await getStorageClassConfigMap({ k8sGet });

  const enhancedParams = {
    ...params,
    storageClassConfigMap,
    isTemplate: true,
  };

  const { template, storages } = getInitializedVMTemplate(enhancedParams);

  const finalTemplate = VMTemplateWrapper.initializeFromSimpleData({
    name: settings[VMSettingsField.NAME],
    namespace,
    labels: {
      [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM,
    },
    objects: [template.getMutableVM().asMutableResource()],
    parameters: [
      {
        name: TEMPLATE_PARAM_VM_NAME,
        description: TEMPLATE_PARAM_VM_NAME_DESC,
        required: true,
      },
    ],
  });
  const mutableFinalTemplate = new MutableVMTemplateWrapper(finalTemplate.asResource());

  initializeCommonMetadata(enhancedParams, mutableFinalTemplate, template.asMutableResource());

  const templateResult = await k8sCreate(TemplateModel, mutableFinalTemplate.asMutableResource());

  if (templateResult && storages) {
    for (const storage of storages.filter((s) => s.dataVolumeToCreate)) {
      // eslint-disable-next-line no-await-in-loop
      await enhancedK8sMethods.k8sCreate(
        DataVolumeModel,
        new MutableDataVolumeWrapper(storage.dataVolumeToCreate, true)
          .addOwnerReferences(
            buildOwnerReference(templateResult, { blockOwnerDeletion: true, controller: true }),
          )
          .asMutableResource(),
      );
    }
  }
  return getActualState();
};

export const createVM = async (params: CreateVMParams) => {
  const { enhancedK8sMethods, namespace, vmSettings, openshiftFlag } = params;
  const { k8sGet, k8sCreate, getActualState } = enhancedK8sMethods;

  const storageClassConfigMap = await getStorageClassConfigMap({ k8sGet });
  const enhancedParams = {
    ...params,
    storageClassConfigMap,
    isTemplate: false,
  };

  // TODO add VMWARE import
  let vm;

  if (openshiftFlag) {
    const { template } = getInitializedVMTemplate(enhancedParams);

    const templateToProcess = new MutableVMTemplateWrapper(template.asMutableResource(), {
      copy: true,
    });
    // ProcessedTemplates endpoint will reject the request if user cannot post to the namespace
    // common-templates are stored in openshift namespace, default user can read but cannot post
    templateToProcess.setNamespace(namespace);
    templateToProcess.setParameter(
      TEMPLATE_PARAM_VM_NAME,
      getFieldValue(vmSettings, VMSettingsField.NAME),
    );
    templateToProcess.unrequireParameters(
      new Set(
        templateToProcess
          .getParameters()
          .map((p) => p.name)
          .filter((n) => n !== TEMPLATE_PARAM_VM_NAME),
      ),
    );

    const processedTemplate = await k8sCreate(
      ProcessedTemplatesModel,
      templateToProcess.asMutableResource(),
      null,
      { disableHistory: true },
    ); // temporary

    vm = new MutableVMWrapper(selectVM(processedTemplate));
    vm.setNamespace(namespace);
    initializeCommonMetadata(enhancedParams, vm, template.asMutableResource());
  } else {
    vm = new MutableVMWrapper();
    vm.setModel(VirtualMachineModel)
      .setNamespace(namespace)
      .setName(getFieldValue(vmSettings, VMSettingsField.NAME));
    initializeCommonMetadata(enhancedParams, vm);
    initializeVM(enhancedParams, vm);
  }
  initializeCommonVMMetadata(enhancedParams, vm);
  await k8sCreate(VirtualMachineModel, vm.asMutableResource());

  return getActualState();
};

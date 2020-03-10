import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import { getStorageClassConfigMap } from '../../config-map/storage-class';
import { asSimpleSettings } from '../../../../components/create-vm-wizard/selectors/vm-settings';
import { VMTemplateWrapper } from '../../../wrapper/vm/vm-template-wrapper';
import {
  TEMPLATE_PARAM_VM_NAME,
  TEMPLATE_PARAM_VM_NAME_DESC,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
} from '../../../../constants/vm';
import { DataVolumeWrapper } from '../../../wrapper/vm/data-volume-wrapper';
import { buildOwnerReference } from '../../../../utils';
import { VMWrapper } from '../../../wrapper/vm/vm-wrapper';
import { toShallowJS } from '../../../../utils/immutable';
import { iGetRelevantTemplate } from '../../../../selectors/immutable/template/combined';
import { CreateVMEnhancedParams, CreateVMParams } from './types';
import { initializeVM } from './initialize-vm';
import { getOS, initializeCommonMetadata, initializeCommonVMMetadata } from './common';
import { selectVM } from '../../../../selectors/vm-template/basic';
import { ProcessedTemplatesModel } from '../../../../models/models';

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

  const template = new VMTemplateWrapper(temp, true)
    .init() // make sure api version is correct
    .clearRuntimeMetadata();

  const { storages } = initializeVM(params, template.getVM());

  return { template, storages };
};

export const createVMTemplate = async (params: CreateVMParams) => {
  const { enhancedK8sMethods, namespace, vmSettings } = params;
  const { k8sGet, k8sWrapperCreate, getActualState } = enhancedK8sMethods;

  const storageClassConfigMap = await getStorageClassConfigMap({ k8sGet });

  const enhancedParams = {
    ...params,
    storageClassConfigMap,
    isTemplate: true,
  };

  const combinedSimpleSettings = {
    ...asSimpleSettings(vmSettings),
    ...getOS(enhancedParams),
  };

  const { template, storages } = getInitializedVMTemplate(enhancedParams);

  const finalTemplate = VMTemplateWrapper.initializeFromSimpleData({
    name: combinedSimpleSettings[VMSettingsField.NAME],
    namespace,
    labels: {
      [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM,
    },
    objects: [template.getVM().asResource()],
    parameters: [
      {
        name: TEMPLATE_PARAM_VM_NAME,
        description: TEMPLATE_PARAM_VM_NAME_DESC,
        required: true,
      },
    ],
  });

  initializeCommonMetadata(combinedSimpleSettings, finalTemplate, template.asResource());

  const templateResult = await k8sWrapperCreate(finalTemplate);

  if (templateResult && storages) {
    for (const storage of storages.filter((s) => s.dataVolumeToCreate)) {
      // eslint-disable-next-line no-await-in-loop
      await k8sWrapperCreate(
        new DataVolumeWrapper(storage.dataVolumeToCreate, true).addOwnerReferences(
          buildOwnerReference(templateResult, { blockOwnerDeletion: true, controller: true }),
        ),
      );
    }
  }
  return getActualState();
};

export const createVM = async (params: CreateVMParams) => {
  const { enhancedK8sMethods, namespace, vmSettings, openshiftFlag } = params;
  const { k8sGet, k8sCreate, k8sWrapperCreate, getActualState } = enhancedK8sMethods;

  const storageClassConfigMap = await getStorageClassConfigMap({ k8sGet });
  const enhancedParams = {
    ...params,
    storageClassConfigMap,
    isTemplate: false,
  };
  const combinedSimpleSettings = {
    ...asSimpleSettings(vmSettings),
    ...getOS(enhancedParams),
  };

  // TODO add VMWARE import
  let vmWrapper: VMWrapper;

  if (openshiftFlag) {
    const { template } = getInitializedVMTemplate(enhancedParams);

    // ProcessedTemplates endpoint will reject the request if user cannot post to the namespace
    // common-templates are stored in openshift namespace, default user can read but cannot post
    const templateNamespace = template.getNamespace();
    template
      .setNamespace(namespace)
      .setParameter(TEMPLATE_PARAM_VM_NAME, combinedSimpleSettings[VMSettingsField.NAME])
      .unrequireParameters(
        new Set(
          template
            .getParameters()
            .map((p) => p.name)
            .filter((n) => n !== TEMPLATE_PARAM_VM_NAME),
        ),
      );

    const processedTemplate = await k8sCreate(
      ProcessedTemplatesModel,
      template.asResource(),
      null,
      { disableHistory: true },
    ); // temporary

    template.setNamespace(templateNamespace); // Re-set template namespace

    vmWrapper = new VMWrapper(selectVM(processedTemplate)).setNamespace(namespace);
    initializeCommonMetadata(combinedSimpleSettings, vmWrapper, template.asResource());
  } else {
    vmWrapper = new VMWrapper()
      .init({ namespace })
      .setName(combinedSimpleSettings[VMSettingsField.NAME]);
    initializeCommonMetadata(combinedSimpleSettings, vmWrapper);
    initializeVM(enhancedParams, vmWrapper);
  }
  initializeCommonVMMetadata(combinedSimpleSettings, vmWrapper);

  await k8sWrapperCreate(vmWrapper);

  return getActualState();
};

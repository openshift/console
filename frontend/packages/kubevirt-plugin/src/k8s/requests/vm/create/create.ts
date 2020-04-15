import {
  ImportProvidersField,
  VMImportProvider,
  VMSettingsField,
} from '../../../../components/create-vm-wizard/types';
import {asSimpleSettings, getFieldValue} from '../../../../components/create-vm-wizard/selectors/vm-settings';
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
import { CreateVMParams } from './types';
import { initializeVM } from './initialize-vm';
import { initializeCommonMetadata, initializeCommonVMMetadata } from './common';
import { selectVM } from '../../../../selectors/vm-template/basic';
import { ProcessedTemplatesModel } from '../../../../models/models';
import { ImporterResult, OnVMCreate } from '../types';
import { importV2VVMwareVm } from '../../v2v/import/import-v2vvmware';
import { getImportProvidersFieldValue } from '../../../../components/create-vm-wizard/selectors/import-providers';
import { importV2VOvirtVm } from '../../v2v/import/import-ovirt';
import { getOS } from "../../../../components/create-vm-wizard/selectors/common";

export const getInitializedVMTemplate = (params: CreateVMParams) => {
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
  const { k8sWrapperCreate, getActualState } = enhancedK8sMethods;

  const combinedSimpleSettings = {
    ...asSimpleSettings(vmSettings),
    ...getOS({ osID: getFieldValue(vmSettings, VMSettingsField.OPERATING_SYSTEM), ...params}),
  };

  const { template, storages } = getInitializedVMTemplate(params);

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

const importVM = async (params: CreateVMParams): Promise<ImporterResult> => {
  switch (getImportProvidersFieldValue(params.importProviders, ImportProvidersField.PROVIDER)) {
    case VMImportProvider.VMWARE:
      return importV2VVMwareVm(params);
    case VMImportProvider.OVIRT:
      return importV2VOvirtVm(params);
    default:
      return null;
  }
};

export const createVM = async (params: CreateVMParams) => {
  const { enhancedK8sMethods, namespace, vmSettings, openshiftFlag, isProviderImport } = params;
  const { k8sCreate, k8sWrapperCreate, getActualState } = enhancedK8sMethods;

  const combinedSimpleSettings = {
    ...asSimpleSettings(vmSettings),
    ...getOS({ osID: getFieldValue(vmSettings, VMSettingsField.OPERATING_SYSTEM), ...params}),
  };
  let onVMCreate: OnVMCreate = null;
  if (isProviderImport) {
    const result = await importVM(params);

    if (result?.skipVMCreation) {
      return getActualState();
    }

    params.storages = result?.storages || params.storages;
    params.networks = result?.networks || params.networks;
    onVMCreate = result?.onCreate;
  }

  let vmWrapper: VMWrapper;

  if (openshiftFlag) {
    const { template } = getInitializedVMTemplate(params);

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
    initializeVM(params, vmWrapper);
  }
  initializeCommonVMMetadata(combinedSimpleSettings, vmWrapper);

  const virtualMachine = await k8sWrapperCreate(vmWrapper);

  if (onVMCreate) {
    await onVMCreate(virtualMachine);
  }

  return getActualState();
};

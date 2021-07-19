import { getOS } from '../../../../components/create-vm-wizard/selectors/combined';
import { getImportProvidersFieldValue } from '../../../../components/create-vm-wizard/selectors/import-providers';
import {
  asSimpleSettings,
  getFieldValue,
} from '../../../../components/create-vm-wizard/selectors/vm-settings';
import {
  AUTOUNATTEND,
  sysprepDisk,
  sysprepVolume,
  UNATTEND,
} from '../../../../components/create-vm-wizard/tabs/advanced-tab/sysprep/utils/sysprep-utils';
import {
  ImportProvidersField,
  VMImportProvider,
  VMSettingsField,
} from '../../../../components/create-vm-wizard/types';
import { TEMPLATE_PARAM_VM_NAME, TEMPLATE_PARAM_VM_NAME_DESC } from '../../../../constants/vm';
import { ProcessedTemplatesModel } from '../../../../models/models';
import { iGetRelevantTemplate } from '../../../../selectors/immutable/template/combined';
import { selectVM } from '../../../../selectors/vm-template/basic';
import { toShallowJS } from '../../../../utils/immutable';
import { VMTemplateWrapper } from '../../../wrapper/vm/vm-template-wrapper';
import { VMWrapper } from '../../../wrapper/vm/vm-wrapper';
import { importV2VOvirtVm } from '../../v2v/import/import-ovirt';
import { importV2VVMwareVm } from '../../v2v/import/import-v2vvmware';
import { ImporterResult, OnVMCreate } from '../types';
import {
  initializeCommonMetadata,
  initializeCommonTemplateMetadata,
  initializeCommonVMMetadata,
} from './common';
import { initializeVM } from './initialize-vm';
import { CreateVMParams } from './types';

export const getInitializedVMTemplate = (params: CreateVMParams) => {
  const { vmSettings, iCommonTemplates, iUserTemplate } = params;
  const settings = asSimpleSettings(vmSettings);

  const temp = toShallowJS(
    iUserTemplate ||
      iGetRelevantTemplate(iCommonTemplates, {
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
    ...getOS({ osID: getFieldValue(vmSettings, VMSettingsField.OPERATING_SYSTEM), ...params }),
  };

  const { template } = getInitializedVMTemplate(params);

  const finalTemplate = new VMTemplateWrapper().init({
    name: combinedSimpleSettings[VMSettingsField.NAME],
    namespace,
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
  initializeCommonTemplateMetadata(combinedSimpleSettings, finalTemplate, template.asResource());

  await k8sWrapperCreate(finalTemplate);
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
  const {
    enhancedK8sMethods,
    namespace,
    vmSettings,
    openshiftFlag,
    isProviderImport,
    sysprepData,
  } = params;
  const { k8sCreate, k8sWrapperCreate, getActualState } = enhancedK8sMethods;

  const combinedSimpleSettings = {
    ...asSimpleSettings(vmSettings),
    ...getOS({ osID: getFieldValue(vmSettings, VMSettingsField.OPERATING_SYSTEM), ...params }),
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

  if (sysprepData?.[AUTOUNATTEND] || sysprepData?.[UNATTEND]) {
    vmWrapper.appendStorage({
      disk: sysprepDisk(),
      volume: sysprepVolume(vmWrapper),
    });
  }

  initializeCommonVMMetadata(combinedSimpleSettings, vmWrapper);

  const virtualMachine = await k8sWrapperCreate(vmWrapper);

  if (onVMCreate) {
    await onVMCreate(virtualMachine);
  }

  return getActualState();
};

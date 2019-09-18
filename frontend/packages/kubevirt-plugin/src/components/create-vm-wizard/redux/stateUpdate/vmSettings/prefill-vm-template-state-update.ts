import { createBasicLookup } from '@console/shared/src';
import { InternalActionType, UpdateOptions } from '../../types';
import { iGetVmSettingValue } from '../../../selectors/immutable/vm-settings';
import {
  VMSettingsField,
  VMWizardNetwork,
  VMWizardNetworkType,
  VMWizardProps,
} from '../../../types';
import { iGetLoadedCommonData, iGetName } from '../../../selectors/immutable/selectors';
import { concatImmutableLists, immutableListToShallowJS } from '../../../../../utils/immutable';
import { iGetNetworks as getDialogNetworks } from '../../../selectors/immutable/networks';
import { iGetStorages } from '../../../selectors/immutable/storage';
import { podNetwork } from '../../initial-state/networks-tab-initial-state';
import { vmWizardInternalActions } from '../../internal-actions';
import { CUSTOM_FLAVOR, NetworkInterfaceModel } from '../../../../../constants/vm';
import {
  DEFAULT_CPU,
  getCloudInitUserData,
  getCPU,
  getInterfaces,
  getMemory,
  getNetworks,
  hasAutoAttachPodInterface,
  parseCPU,
} from '../../../../../selectors/vm';
import { selectVM } from '../../../../../selectors/vm-template/selectors';
import {
  getTemplateFlavors,
  getTemplateOperatingSystems,
  getTemplateWorkloadProfiles,
} from '../../../../../selectors/vm-template/advanced';
import { ProvisionSource, V1Network } from '../../../../../types/vm';
import {
  getTemplateProvisionSource,
  getTemplateStorages,
} from '../../../../../selectors/vm-template/combined';
import { getFlavors } from '../../../../../selectors/vm-template/combined-dependent';
import { getSimpleName } from '../../../../../selectors/utils';
import { getNextIDResolver } from '../../../../../utils/utils';

// used by user template; currently we do not support PROVISION_SOURCE_IMPORT
const provisionSourceDataFieldResolver = {
  [ProvisionSource.CONTAINER]: VMSettingsField.CONTAINER_IMAGE,
  [ProvisionSource.URL]: VMSettingsField.IMAGE_URL,
};

export const prefillVmTemplateUpdater = ({ id, dispatch, getState }: UpdateOptions) => {
  const state = getState();

  const userTemplateName = iGetVmSettingValue(state, id, VMSettingsField.USER_TEMPLATE);

  const iUserTemplates = iGetLoadedCommonData(state, id, VMWizardProps.userTemplates);

  const iUserTemplate =
    userTemplateName && iUserTemplates
      ? iUserTemplates.find((template) => iGetName(template) === userTemplateName)
      : null;

  const vmSettingsUpdate = {};

  // filter out oldTemplates
  let networksUpdate = immutableListToShallowJS<VMWizardNetwork>(
    getDialogNetworks(state, id),
  ).filter((network) => network.type !== VMWizardNetworkType.TEMPLATE);
  const getNextNetworkID = getNextIDResolver(networksUpdate);

  const storageRowsUpdate = immutableListToShallowJS(iGetStorages(state, id)).filter(
    (storage) => !(storage.templateStorage || storage.rootStorage),
  );

  if (!networksUpdate.find((row) => !!row.network.pod)) {
    networksUpdate.unshift({ ...podNetwork, id: getNextNetworkID() });
  }

  if (iUserTemplate) {
    const dataVolumes = immutableListToShallowJS(
      iGetLoadedCommonData(state, id, VMWizardProps.userTemplates),
    );
    const userTemplate = iUserTemplate.toJS();

    const vm = selectVM(userTemplate);

    // update flavor
    const [flavor] = getTemplateFlavors([userTemplate]);
    vmSettingsUpdate[VMSettingsField.FLAVOR] = { value: flavor };
    if (flavor === CUSTOM_FLAVOR) {
      vmSettingsUpdate[VMSettingsField.CPU] = { value: parseCPU(getCPU(vm), DEFAULT_CPU).cores }; // TODO also add sockets + threads
      const memory = getMemory(vm);
      vmSettingsUpdate[VMSettingsField.MEMORY] = { value: memory ? parseInt(memory, 10) : null };
    }

    // update os
    const [os] = getTemplateOperatingSystems([userTemplate]);
    vmSettingsUpdate[VMSettingsField.OPERATING_SYSTEM] = { value: os && os.id };

    // update workload profile
    const [workload] = getTemplateWorkloadProfiles([userTemplate]);
    vmSettingsUpdate[VMSettingsField.WORKLOAD_PROFILE] = { value: workload };

    // update cloud-init
    const cloudInitUserData = getCloudInitUserData(vm);
    if (cloudInitUserData) {
      vmSettingsUpdate[VMSettingsField.USE_CLOUD_INIT] = { value: true };
      vmSettingsUpdate[VMSettingsField.USE_CLOUD_INIT_CUSTOM_SCRIPT] = { value: true };
      vmSettingsUpdate[VMSettingsField.CLOUD_INIT_CUSTOM_SCRIPT] = {
        value: cloudInitUserData || '',
      };
    }

    // update provision source
    const provisionSource = getTemplateProvisionSource(userTemplate, dataVolumes);
    if (provisionSource.type === ProvisionSource.UNKNOWN) {
      vmSettingsUpdate[VMSettingsField.PROVISION_SOURCE_TYPE] = { value: null };
    } else {
      vmSettingsUpdate[VMSettingsField.PROVISION_SOURCE_TYPE] = { value: provisionSource.type };
      const dataFieldName = provisionSourceDataFieldResolver[provisionSource.type];
      if (dataFieldName) {
        vmSettingsUpdate[dataFieldName] = { value: provisionSource.source };
      }
    }

    const networkLookup = createBasicLookup<V1Network>(getNetworks(vm), getSimpleName);
    // prefill networks
    const templateNetworks = getInterfaces(vm).map((intface) => ({
      id: getNextNetworkID(),
      type: VMWizardNetworkType.TEMPLATE,
      network: networkLookup[getSimpleName(intface)],
      networkInterface: {
        ...intface,
        model: intface.model || NetworkInterfaceModel.VIRTIO.getValue(),
      },
    }));

    // remove pod networks if there is already one in template or autoAttachPodInterface is set to false
    if (
      templateNetworks.some((network) => !!network.network.pod) ||
      !hasAutoAttachPodInterface(vm, true)
    ) {
      networksUpdate = networksUpdate.filter((network) => !network.network.pod);
    }

    networksUpdate.push(...templateNetworks);

    // prefill storage
    const templateStorages = getTemplateStorages(userTemplate, dataVolumes).map((storage) => ({
      templateStorage: storage,
      rootStorage: storage.disk.bootOrder === 1 ? {} : undefined,
    }));
    storageRowsUpdate.push(...templateStorages);
  } else {
    const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);

    const flavors = getFlavors(
      immutableListToShallowJS(concatImmutableLists(iCommonTemplates, iUserTemplates)),
      {
        workload: iGetVmSettingValue(state, id, VMSettingsField.WORKLOAD_PROFILE),
        os: iGetVmSettingValue(state, id, VMSettingsField.OPERATING_SYSTEM),
        userTemplate: null,
      },
    );
    if (flavors.length === 1) {
      vmSettingsUpdate[VMSettingsField.FLAVOR] = { value: flavors[0] };
    }
  }

  dispatch(vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, vmSettingsUpdate));
  dispatch(vmWizardInternalActions[InternalActionType.SetNetworks](id, networksUpdate));
  dispatch(vmWizardInternalActions[InternalActionType.SetStorages](id, storageRowsUpdate));
};

import {
  hasVMSettingsValueChanged,
  iGetRelevantTemplateSelectors,
} from '../../selectors/immutable/vm-settings';
import { CloudInitField, VMSettingsField, VMWizardProps, VMWizardStorageType } from '../../types';
import { InternalActionType, UpdateOptions } from '../types';
import { iGetCommonData, iGetLoadedCommonData } from '../../selectors/immutable/selectors';
import {
  iGetCommonTemplateCloudInit,
  iGetRelevantTemplate,
} from '../../../../selectors/immutable/template/combined';
import { CLOUDINIT_DISK, DiskType, DiskBus, VolumeType } from '../../../../constants/vm';
import { vmWizardInternalActions } from '../internal-actions';
import {
  CloudInitDataFormKeys,
  CloudInitDataHelper,
  generateCloudInitPassword,
} from '../../../../k8s/wrapper/vm/cloud-init-data-helper';
import { iGet, iGetIn, toShallowJS } from '../../../../utils/immutable';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { iGetStorages } from '../../selectors/immutable/storage';

export const commonTemplatesUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  const iUserTemplate = iGetLoadedCommonData(state, id, VMWizardProps.userTemplate);

  if (
    !hasVMSettingsValueChanged(
      prevState,
      state,
      id,
      VMSettingsField.OPERATING_SYSTEM,
      VMSettingsField.FLAVOR,
      VMSettingsField.WORKLOAD_PROFILE,
    ) ||
    iUserTemplate ||
    iGetCommonData(state, id, VMWizardProps.isProviderImport)
  ) {
    return;
  }
  const iCloudInitStorage = iGetStorages(state, id).find((stor) =>
    iGetIn(stor, ['volume', 'cloudInitNoCloud']),
  );

  const relevantOptions = iGetRelevantTemplateSelectors(state, id);
  const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);
  const iTemplate = iCommonTemplates && iGetRelevantTemplate(iCommonTemplates, relevantOptions);
  const cloudInitHelper = new CloudInitDataHelper(
    toShallowJS(iGetCommonTemplateCloudInit(iTemplate)),
  );
  // generate new password if the common template has a password for cloud ionit
  if (!cloudInitHelper.isEmpty()) {
    cloudInitHelper.set(CloudInitDataFormKeys.PASSWORD, generateCloudInitPassword());

    dispatch(
      vmWizardInternalActions[InternalActionType.SetCloudInitFieldValue](
        id,
        CloudInitField.IS_FORM,
        false,
      ),
    );
    dispatch(
      vmWizardInternalActions[InternalActionType.UpdateStorage](id, {
        id: iGet(iCloudInitStorage, 'id'),
        type: iGet(iCloudInitStorage, 'type') || VMWizardStorageType.TEMPLATE_CLOUD_INIT,
        disk: new DiskWrapper()
          .init({
            name: iGetIn(iCloudInitStorage, ['volume', 'name']) || CLOUDINIT_DISK,
          })
          .setType(DiskType.DISK, { bus: DiskBus.VIRTIO })
          .asResource(),
        volume: new VolumeWrapper()
          .init({ name: iGetIn(iCloudInitStorage, ['volume', 'name']) || CLOUDINIT_DISK })
          .setType(VolumeType.CLOUD_INIT_NO_CLOUD, cloudInitHelper.asCloudInitNoCloudSource())
          .asResource(),
      }),
    );
  } else if (iGet(iCloudInitStorage, 'type') === VMWizardStorageType.TEMPLATE_CLOUD_INIT) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetCloudInitFieldValue](
        id,
        CloudInitField.IS_FORM,
        true,
      ),
    );
    dispatch(
      vmWizardInternalActions[InternalActionType.RemoveStorage](id, iGet(iCloudInitStorage, 'id')),
    );
  }
};

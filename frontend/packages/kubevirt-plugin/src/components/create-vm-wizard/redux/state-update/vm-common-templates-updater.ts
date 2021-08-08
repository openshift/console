import { CLOUDINIT_DISK, DiskBus, DiskType, VolumeType } from '../../../../constants/vm';
import { CloudInitDataHelper } from '../../../../k8s/wrapper/vm/cloud-init-data-helper';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import {
  iGetCommonTemplateCloudInit,
  iGetCommonTemplateDiskBus,
  iGetRelevantTemplate,
} from '../../../../selectors/immutable/template/combined';
import { iGet, iGetIn, toShallowJS } from '../../../../utils/immutable';
import { iGetCommonData, iGetLoadedCommonData } from '../../selectors/immutable/selectors';
import { iGetStorages } from '../../selectors/immutable/storage';
import {
  hasVMSettingsValueChanged,
  iGetRelevantTemplateSelectors,
} from '../../selectors/immutable/vm-settings';
import { CloudInitField, VMSettingsField, VMWizardProps, VMWizardStorageType } from '../../types';
import { vmWizardInternalActions } from '../internal-actions';
import { InternalActionType, UpdateOptions } from '../types';

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

  if (!cloudInitHelper.isEmpty()) {
    let isCloudInitForm = false;
    if (cloudInitHelper.includesOnlyFormValues()) {
      isCloudInitForm = true;
      cloudInitHelper.makeFormCompliant();
    }

    dispatch(
      vmWizardInternalActions[InternalActionType.SetCloudInitFieldValue](
        id,
        CloudInitField.IS_FORM,
        isCloudInitForm,
      ),
    );
    dispatch(
      vmWizardInternalActions[InternalActionType.UpdateStorage](id, {
        id: iGet(iCloudInitStorage, 'id'),
        type: VMWizardStorageType.TEMPLATE_CLOUD_INIT,
        disk: new DiskWrapper()
          .init({
            name: CLOUDINIT_DISK,
          })
          .setType(DiskType.DISK, {
            bus:
              DiskBus.fromString(iGetCommonTemplateDiskBus(iTemplate, 'cloudinitdisk')) ||
              DiskBus.VIRTIO,
          })
          .asResource(),
        volume: new VolumeWrapper()
          .init({ name: CLOUDINIT_DISK })
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

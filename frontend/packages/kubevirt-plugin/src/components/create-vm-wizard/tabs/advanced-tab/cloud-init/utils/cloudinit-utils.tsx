import { CLOUDINIT_DISK } from '../../../../../../constants/vm';
import { DiskBus, DiskType, VolumeType } from '../../../../../../constants/vm/storage';
import { CloudInitDataHelper } from '../../../../../../k8s/wrapper/vm/cloud-init-data-helper';
import { DiskWrapper } from '../../../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../../../k8s/wrapper/vm/volume-wrapper';
import { prefixedID } from '../../../../../../utils';
import { iGet, toJS, toShallowJS } from '../../../../../../utils/immutable';
import { VMWizardStorageType } from '../../../../types';
import { cloudInitActions } from '../redux/actions';

export const onDataChanged = (
  userData: string,
  encodeDataToBase64: boolean,
  iCloudInitStorage,
  wizardReduxID,
  dispatch,
) => {
  if (
    !userData &&
    ![VMWizardStorageType.TEMPLATE, VMWizardStorageType.PROVISION_SOURCE_TEMPLATE_DISK].includes(
      iGet(iCloudInitStorage, 'type'),
    )
  ) {
    if (iCloudInitStorage) {
      dispatch(cloudInitActions.removeStorage(iGet(iCloudInitStorage, 'id'), wizardReduxID));
    }
    return;
  }

  const typeData = CloudInitDataHelper.toCloudInitNoCloudSource(userData, encodeDataToBase64);

  if (!iCloudInitStorage) {
    dispatch(
      cloudInitActions.updateStorage(
        {
          type: VMWizardStorageType.UI_INPUT,
          disk: DiskWrapper.initializeFromSimpleData({
            name: CLOUDINIT_DISK,
            type: DiskType.DISK,
            bus: DiskBus.VIRTIO,
          }).asResource(),
          volume: VolumeWrapper.initializeFromSimpleData({
            name: CLOUDINIT_DISK,
            type: VolumeType.CLOUD_INIT_NO_CLOUD,
            typeData,
          }).asResource(),
        },
        wizardReduxID,
      ),
    );
  } else {
    dispatch(
      cloudInitActions.updateStorage(
        {
          id: iCloudInitStorage && iCloudInitStorage.get('id'),
          type: iCloudInitStorage && iCloudInitStorage.get('type'),
          disk: toShallowJS(iCloudInitStorage.get('disk')),
          volume: new VolumeWrapper(toJS(iCloudInitStorage.get('volume')))
            .setTypeData(typeData)
            .asResource(),
        },
        wizardReduxID,
      ),
    );
  }
};

export const cloudinitIDGenerator = (id: string) => prefixedID('cloudint', id);

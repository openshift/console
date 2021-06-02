import * as React from 'react';
import { confirmModal } from '@console/internal/components/modals';
import { CLOUDINIT_DISK } from '../../../../../../constants/vm';
import { DiskBus, DiskType, VolumeType } from '../../../../../../constants/vm/storage';
import { CloudInitDataHelper } from '../../../../../../k8s/wrapper/vm/cloud-init-data-helper';
import { DiskWrapper } from '../../../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../../../k8s/wrapper/vm/volume-wrapper';
import { iGet, toJS, toShallowJS } from '../../../../../../utils/immutable';
import { VMWizardStorageType } from '../../../../types';
import CloudInitMessage from '../CloudInitMessage';
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

export const onFormValueChanged = (
  userData: string,
  key: string,
  value: any,
  encodeDataToBase64: boolean,
  iCloudInitStorage,
  wizardReduxID,
  dispatch,
) => {
  const cloudInitData = new CloudInitDataHelper({ userData });
  if (!userData) {
    cloudInitData.makeFormCompliant();
  }
  cloudInitData.set(key, value);

  onDataChanged(
    cloudInitData.areAllFormValuesEmpty() ? '' : cloudInitData.getUserData(),
    encodeDataToBase64,
    iCloudInitStorage,
    wizardReduxID,
    dispatch,
  );
};

export const onSetIsForm = (
  t,
  form,
  userData,
  isBase64,
  iCloudInitStorage,
  wizardReduxID,
  dispatch,
) => {
  if (form) {
    const cloudInitData = new CloudInitDataHelper({ userData });
    const executeFn = () => {
      cloudInitData.makeFormCompliant();
      onFormValueChanged(
        cloudInitData.getUserData(),
        null,
        null,
        isBase64,
        iCloudInitStorage,
        wizardReduxID,
        dispatch,
      );
      cloudInitActions.setIsForm(form, wizardReduxID, dispatch);
      return Promise.resolve();
    };

    if (cloudInitData.includesOnlyFormValues()) {
      executeFn();
    } else {
      confirmModal({
        title: t('kubevirt-plugin~Data loss confirmation'),
        message: <CloudInitMessage cloudInitData={cloudInitData} />,
        btnText: t('kubevirt-plugin~Confirm'),
        executeFn,
      });
    }
  } else {
    cloudInitActions.setIsForm(form, wizardReduxID, dispatch);
  }
};

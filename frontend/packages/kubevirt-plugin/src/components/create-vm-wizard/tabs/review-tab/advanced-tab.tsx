import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { getBooleanAsEnabledValue } from '../../../../utils';
import VirtualMachineHardware from '../../../create-vm/forms/VirtualMachineHardware';
import { iGetCloudInitNoCloudStorage } from '../../selectors/immutable/storage';
import { HardwareDevicesField } from '../../types';
import { iGetHardwareField } from '../advanced-tab/hardware-devices/selectors';

import './review-tab.scss';

const AdvancedReviewConnected: React.FC<AdvancedReviewConnectedProps> = (props) => {
  const { t } = useTranslation();
  const { cloudInitEnabled, gpus, hostDevices } = props;

  const cloudInitEnabledValue = getBooleanAsEnabledValue(cloudInitEnabled);

  return (
    <dl className="kubevirt-create-vm-modal__review-tab__data-list">
      <dt>{t('kubevirt-plugin~Cloud Init')}</dt>
      <dd id="wizard-review-cloud_init">{cloudInitEnabledValue}</dd>
      <dt>{t('kubevirt-plugin~GPU Devices')}</dt>
      <dd id="wizard-review-gpu_devices">
        <VirtualMachineHardware
          devicesNames={gpus}
          title={t('kubevirt-plugin~GPU Devices ({{numberOfDevices}})', {
            numberOfDevices: gpus?.length,
          })}
        />
      </dd>
      <dt>{t('kubevirt-plugin~Host Devices')}</dt>
      <dd id="wizard-review-host_devices">
        <VirtualMachineHardware
          devicesNames={hostDevices}
          title={t('kubevirt-plugin~Host Devices ({{numberOfDevices}})', {
            numberOfDevices: hostDevices?.length,
          })}
        />
      </dd>
    </dl>
  );
};

type AdvancedReviewConnectedProps = {
  cloudInitEnabled: boolean;
  gpus?: string[];
  hostDevices?: string[];
};

const stateToProps = (state, { wizardReduxID }) => ({
  cloudInitEnabled: !!iGetCloudInitNoCloudStorage(state, wizardReduxID),
  hostDevices: iGetHardwareField(state, wizardReduxID, HardwareDevicesField.HOST_DEVICES)
    ?.toJS()
    .map((dev) => dev?.deviceName),
  gpus: iGetHardwareField(state, wizardReduxID, HardwareDevicesField.GPUS)
    ?.toJS()
    .map((dev) => dev?.deviceName),
});

export const AdvancedReviewTab = connect(stateToProps)(AdvancedReviewConnected);

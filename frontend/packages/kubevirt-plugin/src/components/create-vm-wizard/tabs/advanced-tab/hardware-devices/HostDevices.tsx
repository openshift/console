import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { iGetIn } from '../../../../../utils/immutable';
import { HardwareDevice } from '../../../../HardwareDevicesList/HardwareDevicesList';
import { HardwareDevicesField } from '../../../types';
import { HardwareDevices } from './HardwareDevices';
import { iGetVmAdvancedSettings } from './selectors';

type HostDevicesProps = {
  wizardReduxID: string;
  vmAdvancedSettings: any;
};

export const HostDevicesCompenent: React.FC<HostDevicesProps> = ({
  wizardReduxID,
  vmAdvancedSettings,
}) => {
  const { t } = useTranslation();

  const getFieldValue = React.useCallback(
    (key: HardwareDevicesField) => iGetIn(vmAdvancedSettings, [key, 'value']),
    [vmAdvancedSettings],
  );

  const devices: HardwareDevice[] = getFieldValue(HardwareDevicesField.HOST_DEVICES)?.toJS();
  const emptyState = (
    <div className="kv-hardware__empty-list">{t('kubevirt-plugin~No Host devices found')}</div>
  );
  return (
    <HardwareDevices
      wizardReduxID={wizardReduxID}
      field={HardwareDevicesField.HOST_DEVICES}
      hardwareDevices={devices}
      devicesNames={devices?.map((dev) => dev.name)}
      emptyState={emptyState}
      addDeviceText={t('kubevirt-plugin~Add Host device')}
      title={t('kubevirt-plugin~Host devices')}
    />
  );
};

const stateToProps = (state, { wizardReduxID }) => ({
  vmAdvancedSettings: iGetVmAdvancedSettings(state, wizardReduxID),
});

export const HostDevices = connect(stateToProps)(HostDevicesCompenent);

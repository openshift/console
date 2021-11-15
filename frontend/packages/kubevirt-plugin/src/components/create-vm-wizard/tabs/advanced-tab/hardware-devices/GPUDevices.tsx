import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { iGetIn } from '../../../../../utils/immutable';
import { HardwareDevice } from '../../../../HardwareDevicesList/HardwareDevicesList';
import { HardwareDevicesField } from '../../../types';
import { HardwareDevices } from './HardwareDevices';
import { iGetVmAdvancedSettings } from './selectors';

type GPUDevicesProps = {
  wizardReduxID: string;
  vmAdvancedSettings: any;
};

export const GPUDevicesCompenent: React.FC<GPUDevicesProps> = ({
  wizardReduxID,
  vmAdvancedSettings,
}) => {
  const { t } = useTranslation();

  const getFieldValue = React.useCallback(
    (key: HardwareDevicesField) => iGetIn(vmAdvancedSettings, [key, 'value']),
    [vmAdvancedSettings],
  );

  const devices: HardwareDevice[] = getFieldValue(HardwareDevicesField.GPUS)?.toJS();
  const emptyState = (
    <div className="kv-hardware__empty-list">{t('kubevirt-plugin~No GPU devices found')}</div>
  );
  return (
    <HardwareDevices
      wizardReduxID={wizardReduxID}
      field={HardwareDevicesField.GPUS}
      hardwareDevices={devices}
      devicesNames={devices?.map((dev) => dev.name)}
      emptyState={emptyState}
      addDeviceText={t('kubevirt-plugin~Add GPU device')}
      title={t('kubevirt-plugin~GPU devices')}
    />
  );
};

const stateToProps = (state, { wizardReduxID }) => ({
  vmAdvancedSettings: iGetVmAdvancedSettings(state, wizardReduxID),
});

export const GPUDevices = connect(stateToProps)(GPUDevicesCompenent);

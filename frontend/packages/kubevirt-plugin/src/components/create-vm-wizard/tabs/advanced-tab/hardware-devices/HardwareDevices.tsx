import * as React from 'react';
import { Grid, Text, TextVariants } from '@patternfly/react-core';
import { connect } from 'react-redux';
import { useHyperconvergedCR } from '../../../../../hooks/use-hyperconverged-resource';
import HardwareDevicesList, {
  HardwareDevice,
} from '../../../../HardwareDevicesList/HardwareDevicesList';
import HWContext from '../../../../modals/hardware-devices/hardware-devices-context';
import { vmWizardActions } from '../../../redux/actions';
import { ActionType } from '../../../redux/types';
import { HardwareDevicesField } from '../../../types';

type HardwareDevicesProps = {
  wizardReduxID: string;
  field: HardwareDevicesField;
  onFieldChange: (key: HardwareDevicesField, value: any | any[]) => void;
  hardwareDevices?: HardwareDevice[];
  devicesNames?: string[];
  emptyState?: React.ReactNode;
  addDeviceText?: string;
  title?: string;
};

export const HardwareDevicesCompenent: React.FC<HardwareDevicesProps> = ({
  field,
  onFieldChange,
  hardwareDevices,
  devicesNames,
  emptyState,
  addDeviceText,
  title,
}) => {
  const [devices, setDevices] = React.useState<HardwareDevice[]>(hardwareDevices);
  const [usedNames, setUsedNames] = React.useState<string[]>(devicesNames);

  const [name, setName] = React.useState<string>('');
  const [deviceName, setDeviceName] = React.useState<string>('');
  const [showAddDeviceRow, setShowAddDeviceRow] = React.useState<boolean>(false);
  const [isBlur, setIsBlur] = React.useState<boolean>(false);

  const [hc, loaded, loadError] = useHyperconvergedCR();

  const isUserForbidden = React.useMemo(() => !hc && !loaded && loadError?.code === 403, [
    hc,
    loaded,
    loadError,
  ]);

  const isNameValid = name?.length > 0 && !usedNames?.includes(name);
  const isDeviceNameValid = deviceName?.length > 0;

  const onDetachHandler = (selectedName) => {
    setUsedNames((prevState) => prevState?.filter((item) => item !== selectedName));
    setDevices((prevState) => {
      const temp = prevState?.filter((item) => item?.name !== selectedName);
      onFieldChange(field, temp);
      return temp;
    });
  };

  React.useEffect(() => {
    if (isNameValid && isDeviceNameValid && isBlur) {
      // when user focus out of text input, and both name and deviceName are vaild
      const device: HardwareDevice = {
        name,
        deviceName,
      };

      setUsedNames((prevState) => (prevState?.length ? [...prevState, name] : [name]));
      setDevices((prevState) => {
        const temp = prevState?.length > 0 ? [...prevState, device] : [device];
        onFieldChange(field, temp);
        return temp;
      });
      setShowAddDeviceRow(false);
      setName('');
      setDeviceName('');
    }
  }, [isNameValid, isDeviceNameValid, isBlur, name, deviceName, onFieldChange, field]);

  return (
    <div className="kv-hardware__form">
      <Text component={TextVariants.h4}>{title}</Text>
      <Grid className="kv-labels-list__grid">
        <HWContext.Provider
          value={{
            isBlur,
            isNameEmpty: name?.length === 0,
            isNameUsed: usedNames?.includes(name),
          }}
        >
          <HardwareDevicesList
            devices={devices}
            onAttachHandler={() => setShowAddDeviceRow(true)}
            onCancelAttachHandler={() => setShowAddDeviceRow(false)}
            onDetachHandler={onDetachHandler}
            showAddDeviceRow={showAddDeviceRow}
            name={name}
            onNameChange={setName}
            onValidateName={() => setIsBlur(true)}
            onResetValidateName={() => setIsBlur(false)}
            deviceName={deviceName}
            onDeviceNameChange={setDeviceName}
            addDeviceText={addDeviceText}
            emptyState={emptyState}
            isDisabled={isUserForbidden}
          />
        </HWContext.Provider>
      </Grid>
    </div>
  );
};

const dispatchToProps = (dispatch, props) => ({
  onFieldChange: (key, value) =>
    dispatch(vmWizardActions[ActionType.SetVmHardwareFieldValue](props.wizardReduxID, key, value)),
});

export const HardwareDevices = connect(null, dispatchToProps)(HardwareDevicesCompenent);

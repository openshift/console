import * as React from 'react';
import { BootableDeviceType } from '../../types';
import { AddDeviceButton } from './add-device-button';
import { AddDeviceFormSelect } from './add-device-form-select';
import { addItemMessage, addItemDisabledMessage, addItemSelectLabel } from './constants';

export const AddDevice = ({ devices, onAdd, isEditMode, setEditMode }: AddDeviceProps) => {
  const options = devices.filter((device) => !device.value.bootOrder);

  const canAddItem = options.length > 0;
  const selectID = 'add-device-select';
  const buttontID = 'add-device-btm';

  return (
    <div className="kubevirt-boot-order__add-device">
      {isEditMode && canAddItem ? (
        <AddDeviceFormSelect
          id={selectID}
          options={options}
          label={addItemSelectLabel}
          onAdd={onAdd}
          onDelete={() => setEditMode(false)}
        />
      ) : (
        <AddDeviceButton
          id={buttontID}
          message={addItemMessage}
          disabledMessage={addItemDisabledMessage}
          isDisabled={!canAddItem}
          onClick={() => setEditMode(true)}
        />
      )}
    </div>
  );
};

export type AddDeviceProps = {
  devices: BootableDeviceType[];
  isEditMode: boolean;
  /** onAdd moves items from the options list to the sources list, key = "<type>-<name>". */
  onAdd: (key: string) => void;
  setEditMode: (boolean) => void;
};

import * as React from 'react';
import { Button, FormSelect, FormSelectOption } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { BootableDeviceType } from '../../types';
import { deviceKey, deviceLabel } from './constants';

export const AddDeviceFormSelect: React.FC<AddDeviceFormSelectProps> = ({
  id,
  options,
  label,
  onAdd,
  onDelete,
}) => (
  <>
    <FormSelect
      value=""
      id={id}
      onChange={onAdd}
      className="kubevirt-boot-order__add-device-select"
    >
      <FormSelectOption label={label} value="" />
      {_.orderBy(options, ['type', 'value.name']).map((option) => (
        <FormSelectOption
          label={deviceLabel(option)}
          value={deviceKey(option)}
          key={deviceKey(option)}
        />
      ))}
    </FormSelect>
    <Button
      onClick={onDelete}
      variant="link"
      className="kubevirt-boot-order__add-device-delete-btn"
    >
      <MinusCircleIcon />
    </Button>
  </>
);

export type AddDeviceFormSelectProps = {
  id: string;
  options: BootableDeviceType[];
  label: string;
  onDelete: () => void;
  /** onAdd moves items from the options list to the sources list, key = "<type>-<name>". */
  onAdd: (key: string) => void;
};

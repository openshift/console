import * as React from 'react';
import * as classNames from 'classnames';
import { Dropdown } from '@console/internal/components/utils';
import { InputGroup, TextInput, ValidatedOptions } from '@patternfly/react-core';
import { TimeUnits } from '../constants/bucket-class';

export const TimeDurationDropdown: React.FC<TimeDurationDropdownProps> = ({
  id,
  inputClassName,
  onChange,
  required,
  testID,
  placeholder,
  inputID,
}) => {
  const [unit, setUnit] = React.useState(TimeUnits.HOUR);
  const [value, setValue] = React.useState(1);
  const [validated, setValidated] = React.useState(ValidatedOptions.success);

  const onValueChange = (val) => {
    setValue(val);
    onChange({ value: val, unit }, setValidated);
  };

  const onUnitChange = (newUnit) => {
    setUnit(newUnit);
    onChange({ value, unit: newUnit }, setValidated);
  };

  return (
    <InputGroup>
      <TextInput
        className={classNames('pf-c-form-control', inputClassName)}
        type="number"
        onChange={onValueChange}
        placeholder={placeholder}
        data-test={testID}
        value={value}
        id={inputID}
        validated={validated}
      />
      <Dropdown
        title={TimeUnits.HOUR}
        selectedKey={unit}
        items={TimeUnits}
        onChange={onUnitChange}
        required={required}
        id={id}
      />
    </InputGroup>
  );
};

type TimeDurationDropdownProps = {
  id: string;
  placeholder?: string;
  inputClassName?: string;
  onChange: Function;
  required?: boolean;
  testID?: string;
  inputID?: string;
};

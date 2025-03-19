import * as React from 'react';
import { Dropdown } from './dropdown';
import { useTranslation } from 'react-i18next';
import { NumberSpinner } from './number-spinner';

export const RequestSizeInput: React.FC<RequestSizeInputProps> = ({
  children,
  defaultRequestSizeUnit,
  defaultRequestSizeValue,
  describedBy,
  dropdownUnits,
  inputID,
  isInputDisabled,
  minValue,
  name,
  onChange,
  placeholder,
  required,
  testID,
}) => {
  const parsedRequestSizeValue = parseInt(defaultRequestSizeValue, 10) || 0;
  const defaultValue = Number.isFinite(parsedRequestSizeValue) ? parsedRequestSizeValue : null;
  const [unit, setUnit] = React.useState<string>(defaultRequestSizeUnit);
  const [value, setValue] = React.useState<number>(defaultValue);

  const onValueChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setValue(parseInt(event.currentTarget.value, 10));
    onChange({ value: event.currentTarget.value, unit });
  };

  const changeValueBy = (changeBy: number) => {
    // When default defaultRequestSizeValue is not set, value becomes NaN and increment decrement buttons of NumberSpinner don't work.
    const newValue = Number.isFinite(value) ? value + changeBy : 0 + changeBy;
    setValue(newValue);
    onChange({ value: newValue, unit });
  };

  const onUnitChange = (newUnit) => {
    setUnit(newUnit);
    onChange({ value, unit: newUnit });
  };

  React.useEffect(() => {
    setUnit(defaultRequestSizeUnit);
    setValue(defaultValue);
  }, [defaultRequestSizeUnit, defaultValue]);

  const { t } = useTranslation();
  const inputName = `${name}Value`;
  const dropdownName = `${name}Unit`;
  return (
    <div>
      <div className="pf-v6-c-input-group">
        <NumberSpinner
          onChange={onValueChange}
          changeValueBy={changeValueBy}
          placeholder={placeholder}
          aria-describedby={describedBy}
          name={inputName}
          id={inputID}
          data-test={testID}
          required={required}
          value={value}
          min={minValue}
          disabled={isInputDisabled}
        />
        <Dropdown
          title={dropdownUnits[defaultRequestSizeUnit]}
          selectedKey={defaultRequestSizeUnit}
          name={dropdownName}
          className="request-size-input__unit"
          items={dropdownUnits}
          onChange={onUnitChange}
          disabled={isInputDisabled}
          required={required}
          ariaLabel={t('public~Number of {{sizeUnit}}', {
            sizeUnit: dropdownUnits[unit],
          })}
        />
      </div>
      {children}
    </div>
  );
};

export type RequestSizeInputProps = {
  placeholder?: string;
  name: string;
  onChange: Function;
  required?: boolean;
  dropdownUnits: any;
  defaultRequestSizeUnit: string;
  defaultRequestSizeValue: string;
  describedBy?: string;
  step?: number;
  minValue?: number;
  inputID?: string;
  testID?: string;
  isInputDisabled?: boolean;
};

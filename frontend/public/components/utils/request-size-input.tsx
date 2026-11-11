import type { FC, ReactEventHandler, ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { NumberSpinner } from './number-spinner';

const parseRequestSizeValue = (raw: string | number): number | null => {
  if (raw === '' || raw === null || raw === undefined) {
    return null;
  }
  const parsed = typeof raw === 'number' ? raw : Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

export const RequestSizeInput: FC<RequestSizeInputProps> = ({
  ariaLabel,
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
  step = 'any',
  testID,
}) => {
  const parsedRequestSizeValue = parseRequestSizeValue(defaultRequestSizeValue);
  const defaultValue = parsedRequestSizeValue ?? 0;
  const [unit, setUnit] = useState<string>(defaultRequestSizeUnit);
  const [value, setValue] = useState<number>(defaultValue);

  const [lastDefault, setLastDefault] = useState({
    unit: defaultRequestSizeUnit,
    value: defaultValue,
  });
  if (lastDefault.unit !== defaultRequestSizeUnit || lastDefault.value !== defaultValue) {
    setLastDefault({ unit: defaultRequestSizeUnit, value: defaultValue });
    setUnit(defaultRequestSizeUnit);
    setValue(defaultValue);
  }

  const onValueChange: ReactEventHandler<HTMLInputElement> = (event) => {
    const raw = event.currentTarget.value;
    const parsed = parseRequestSizeValue(raw);
    // Prefer parsed decimals (e.g. 1.5). Empty/invalid input falls back to 0 so the
    // controlled spinner and parent onChange stay in sync (avoids submitting bare "Gi").
    const nextValue = parsed ?? 0;
    setValue(nextValue);
    onChange({ value: raw === '' || parsed === null ? nextValue : raw, unit });
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

  const { t } = useTranslation('public');
  const inputName = `${name}Value`;
  const dropdownName = `${name}Unit`;
  const numericStep = typeof step === 'number' ? step : 1;
  return (
    <div>
      <div className="pf-v6-c-input-group">
        <NumberSpinner
          onChange={onValueChange}
          changeValueBy={changeValueBy}
          placeholder={placeholder}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          name={inputName}
          id={inputID}
          data-test={testID}
          required={required}
          value={value}
          min={minValue}
          disabled={isInputDisabled}
          step={step}
          stepAmount={numericStep}
        />
        <ConsoleSelect
          title={dropdownUnits[defaultRequestSizeUnit]}
          alwaysShowTitle
          selectedKey={defaultRequestSizeUnit}
          id={dropdownName}
          className="request-size-input__unit"
          items={dropdownUnits}
          onChange={onUnitChange}
          disabled={isInputDisabled}
          required={required}
          ariaLabel={t('Number of {{sizeUnit}}', {
            sizeUnit: dropdownUnits[unit],
          })}
        />
      </div>
      {children}
    </div>
  );
};

export type RequestSizeInputProps = {
  ariaLabel?: string;
  placeholder?: string;
  name: string;
  onChange: (data: { value: string | number; unit: string }) => void;
  required?: boolean;
  dropdownUnits: any;
  defaultRequestSizeUnit: string;
  defaultRequestSizeValue: string;
  describedBy?: string;
  /** HTML/PatternFly step; use `'any'` (default) to allow fractional sizes such as 1.5Gi. */
  step?: number | 'any';
  minValue?: number;
  inputID?: string;
  testID?: string;
  isInputDisabled?: boolean;
  children?: ReactNode;
};

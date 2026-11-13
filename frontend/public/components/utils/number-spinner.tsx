import type { FC, HTMLProps } from 'react';
import type { ButtonProps } from '@patternfly/react-core';
import { NumberInput } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const NumberSpinner: FC<NumberSpinnerProps> = ({
  className,
  changeValueBy,
  min,
  max,
  value,
  step,
  stepAmount = 1,
  'aria-label': ariaLabel,
  ...inputProps
}) => {
  const { t } = useTranslation('public');

  return (
    <div className="co-m-number-spinner">
      <NumberInput
        min={min}
        max={max}
        value={value}
        step={typeof step === 'number' ? step : undefined}
        onMinus={() => changeValueBy(-stepAmount)}
        onChange={inputProps.onChange}
        onPlus={() => changeValueBy(stepAmount)}
        inputAriaLabel={ariaLabel}
        inputProps={{ ...inputProps, ...(step !== undefined ? { step } : {}) }}
        className={className}
        minusBtnAriaLabel={t('Decrement')}
        minusBtnProps={{ 'data-test-id': 'Decrement', 'data-test': 'Decrement' } as ButtonProps}
        plusBtnAriaLabel={t('Increment')}
        plusBtnProps={{ 'data-test-id': 'Increment', 'data-test': 'Increment' } as ButtonProps}
        isDisabled={inputProps.disabled}
      />
    </div>
  );
};

export type NumberSpinnerProps = {
  value: number;
  className?: string;
  changeValueBy: (operation: number) => void;
  min?: number;
  max?: number;
  /** Native input step (`'any'` allows decimals). */
  step?: number | 'any';
  /** Amount applied by +/- buttons when `step` is `'any'` or omitted. */
  stepAmount?: number;
} & Omit<HTMLProps<HTMLInputElement>, 'step'>;

import type { FC, HTMLProps } from 'react';
import { ButtonProps, NumberInput } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const NumberSpinner: FC<NumberSpinnerProps> = ({
  className,
  changeValueBy,
  min,
  max,
  value,
  'aria-label': ariaLabel,
  ...inputProps
}) => {
  const { t } = useTranslation();

  return (
    <div className="co-m-number-spinner">
      <NumberInput
        min={min}
        max={max}
        value={value}
        onMinus={() => changeValueBy(-1)}
        onChange={inputProps.onChange}
        onPlus={() => changeValueBy(1)}
        inputAriaLabel={ariaLabel}
        inputProps={{ ...inputProps }}
        className={className}
        minusBtnAriaLabel={t('public~Decrement')}
        minusBtnProps={{ 'data-test-id': 'Decrement' } as ButtonProps}
        plusBtnAriaLabel={t('public~Increment')}
        plusBtnProps={{ 'data-test-id': 'Increment' } as ButtonProps}
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
} & HTMLProps<HTMLInputElement>;

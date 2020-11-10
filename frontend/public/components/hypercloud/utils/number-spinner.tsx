import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { Button } from '@patternfly/react-core';
import { MinusSquareIcon, PlusSquareIcon } from '@patternfly/react-icons';
import { useFormContext } from 'react-hook-form';

export const NumberSpinner: React.FC<NumberSpinnerProps> = ({ className, initialValue, min, max, name, ...inputProps }) => {
  const { register } = useFormContext();
  const [value, setValue] = React.useState(initialValue);
  const changeValueBy = operation => {
    setValue(_.toInteger(value) + operation);
  };
  return (
    <div>
      <Button onClick={() => changeValueBy(-1)} type="button" variant="plain" isDisabled={!_.isNil(min) && value <= min} aria-label="Decrement" className="co-m-number-spinner__button">
        <MinusSquareIcon className="co-m-number-spinner__down-icon" />
      </Button>
      <input name={name} type="number" ref={register({ min: min, max: max })} value={value} onChange={(e: any) => setValue(e.target.value)} className={classNames(className, 'co-m-number-spinner__input')} {...inputProps}></input>
      <Button onClick={() => changeValueBy(1)} type="button" variant="plain" isDisabled={!_.isNil(max) && value >= max} aria-label="Increment" className="co-m-number-spinner__button">
        <PlusSquareIcon className="co-m-number-spinner__up-icon" />
      </Button>
    </div>
  );
};

type NumberSpinnerProps = {
  className?: string;
  initialValue?: number;
  min?: number;
  max?: number;
  name?: string;
} & React.HTMLProps<HTMLInputElement>;

NumberSpinner.defaultProps = {
  name: 'numberSpinner',
  initialValue: 0,
};

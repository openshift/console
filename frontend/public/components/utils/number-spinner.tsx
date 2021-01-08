import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { Button } from '@patternfly/react-core';
import { MinusSquareIcon, PlusSquareIcon } from '@patternfly/react-icons';

export const NumberSpinner: React.FC<NumberSpinnerProps> = ({
  className,
  changeValueBy,
  min,
  ...inputProps
}) => {
  return (
    <div>
      <Button
        onClick={() => changeValueBy(-1)}
        type="button"
        variant="plain"
        isDisabled={!_.isNil(min) && inputProps.value <= min}
        aria-label="Decrement"
        className="co-m-number-spinner__button"
      >
        <MinusSquareIcon className="co-m-number-spinner__down-icon" noVerticalAlign />
      </Button>
      <input
        type="number"
        className={classNames(className, 'co-m-number-spinner__input')}
        {...inputProps}
      />
      <Button
        onClick={() => changeValueBy(1)}
        type="button"
        variant="plain"
        aria-label="Increment"
        className="co-m-number-spinner__button"
      >
        <PlusSquareIcon className="co-m-number-spinner__up-icon" noVerticalAlign />
      </Button>
    </div>
  );
};

type NumberSpinnerProps = {
  className?: string;
  changeValueBy: (operation: number) => void;
  min?: number;
} & React.HTMLProps<HTMLInputElement>;

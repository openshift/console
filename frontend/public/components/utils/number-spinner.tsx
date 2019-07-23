import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { MinusSquareIcon, PlusSquareIcon } from '@patternfly/react-icons';

export const NumberSpinner: React.FC<NumberSpinnerProps> = (props) => {
  const inputProps = _.omit(props, ['className', 'changeValueBy']);
  const className = classNames(props.className, 'co-m-number-spinner__input');

  return <div>
    <MinusSquareIcon className="co-m-number-spinner__down-icon" onClick={() => props.changeValueBy(-1)} />
    <input type="number" className={className} {...inputProps} />
    <PlusSquareIcon className="co-m-number-spinner__up-icon" onClick={() => props.changeValueBy(1)} />
  </div>;
};

type NumberSpinnerProps = {
  className?: string;
  changeValueBy: (operation: number) => void;
} & React.HTMLProps<HTMLInputElement>;

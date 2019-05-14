import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';

export const NumberSpinner: React.FC<NumberSpinnerProps> = (props) => {
  const inputProps = _.omit(props, ['className', 'changeValueBy']);
  const className = classNames(props.className, 'co-m-number-spinner__input');

  return <div>
    <i className="fa fa-minus-square co-m-number-spinner__down-icon" onClick={() => props.changeValueBy(-1)}></i>
    <input type="number" className={className} {...inputProps} />
    <i className="fa fa-plus-square co-m-number-spinner__up-icon" onClick={() => props.changeValueBy(1)}></i>
  </div>;
};

type NumberSpinnerProps = {
  className?: string;
  changeValueBy: (operation: number) => void;
} & React.HTMLProps<HTMLInputElement>;

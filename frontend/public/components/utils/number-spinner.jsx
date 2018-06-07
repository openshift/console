import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';

export const NumberSpinner = (props) => {
  const inputProps = _.omit(props, ['className', 'changeValueBy']);
  const className = classNames(props.className, 'co-m-number-spinner__input');

  return <div>
    <i className="fa fa-minus-square co-m-number-spinner__down-icon" onClick={() => props.changeValueBy(-1)}></i>
    <input type="number" className={className} {...inputProps} />
    <i className="fa fa-plus-square co-m-number-spinner__up-icon" onClick={() => props.changeValueBy(1)}></i>
  </div>;
};
NumberSpinner.propTypes = {
  // function that increments/decrements the existing value
  changeValueBy: PropTypes.func.isRequired
};

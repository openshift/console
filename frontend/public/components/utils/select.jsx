import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as classNames from 'classnames';
import {default as ReactSelect} from 'react-select';

export const Select = ({className, ...props}) => {
  const selectClasses = classNames('co-m-select', className);
  return <ReactSelect className={selectClasses} {...props} />
};

Select.props = {
  className: PropTypes.string
};

Select.defaultProps = {};

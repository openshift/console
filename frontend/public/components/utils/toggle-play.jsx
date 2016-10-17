import React from 'react';
import classNames from 'classnames';

export const TogglePlay = ({className, active, onClick}) => {
  const klass = classNames('co-toggle-play fa', className, active ? 'co-toggle-play--active' : 'co-toggle-play--inactive');
  return <button className={klass} onClick={onClick}></button>;
};

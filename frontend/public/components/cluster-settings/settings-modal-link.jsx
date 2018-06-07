import * as React from 'react';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';

import { LoadingInline } from '../utils';

export const SettingsModalLink = ({onClick, outdated, children}) => {
  if (!children) {
    return <LoadingInline />;
  }

  const outdatedClass = outdated ? 'text-muted' : null;
  return <a onClick={onClick} className={classNames('co-m-modal-link', outdatedClass)}>
    {children}
    {outdated && <span className="co-icon-space-l"><LoadingInline /></span>}
  </a>;
};
SettingsModalLink.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  outdated: PropTypes.bool
};

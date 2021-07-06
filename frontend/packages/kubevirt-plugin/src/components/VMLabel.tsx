import * as React from 'react';
import * as classNames from 'classnames';

type VMLabelProps = {
  indication?: string;
};

export const VMLabel: React.FC<VMLabelProps> = ({ indication }) => {
  const classes = classNames('co-m-label', 'co-text-machine');
  if (!indication) {
    return null;
  }

  return <span className={classes}>{indication}</span>;
};

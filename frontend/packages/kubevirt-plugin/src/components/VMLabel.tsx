import * as React from 'react';
import classnames from 'classnames';

type VMLabelProps = {
  indication?: string;
};

export const VMLabel: React.FC<VMLabelProps> = ({ indication }) => {
  const classes = classnames('co-m-label', 'co-text-machine');
  if (!indication) {
    return null;
  }

  return <span className={classes}>{indication}</span>;
};

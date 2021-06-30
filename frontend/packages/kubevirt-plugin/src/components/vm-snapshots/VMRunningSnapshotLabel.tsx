import * as React from 'react';
import * as classNames from 'classnames';

type VMTemplateLabelProps = {
  indication?: string;
};

export const VMRunningSnapshotLabel: React.FC<VMTemplateLabelProps> = ({ indication }) => {
  const classes = classNames('co-m-label', 'co-text-machine');
  if (!indication) {
    return null;
  }

  return <span className={classes}>{indication}</span>;
};

import * as React from 'react';
import * as classNames from 'classnames';

export const ListView: React.FC<ListViewProps> = ({ children, className, ...props }) => {
  const classes = classNames('list-group list-view-pf list-view-pf-view', className);
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

type ListViewProps = {
  children: React.ReactNode;
  className?: string;
};

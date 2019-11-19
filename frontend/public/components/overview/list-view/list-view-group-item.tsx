import * as React from 'react';
import * as classNames from 'classnames';

export const ListViewGroupItem: React.FC<ListViewGroupItemProps> = ({
  children,
  className,
  ...props
}) => {
  const classes = classNames('list-group-item', className);
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

type ListViewGroupItemProps = {
  children: React.ReactNode;
  className?: string;
};

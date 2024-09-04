import * as React from 'react';
import * as classNames from 'classnames';

export const Box: React.FC<BoxProps> = ({ children, className }) => (
  <div className={classNames('cos-status-box', className)}>{children}</div>
);

type BoxProps = {
  children: React.ReactNode;
  className?: string;
};

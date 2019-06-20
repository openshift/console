import * as React from 'react';
import classNames from 'classnames';

export const HealthBody: React.FC<HealthBodyProps> = React.memo(({ children, className }) => (
  <div className={classNames('co-health-card__body', className)}>{children}</div>
));

type HealthBodyProps = {
  className?: string;
  children: React.ReactNode;
};

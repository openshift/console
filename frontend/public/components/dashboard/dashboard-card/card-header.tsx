import * as React from 'react';
import classNames from 'classnames';
import { CardHeader, CardHeaderProps } from '@patternfly/react-core';

export const DashboardCardHeader: React.FC<DashboardCardHeaderProps> = React.memo(({ className, children, ...props }) => (
  <CardHeader {...props} className={classNames('co-dashboard-card__header', className)}>
    {children}
  </CardHeader>
));

type DashboardCardHeaderProps = CardHeaderProps & {
  className?: string;
  children: React.ReactNode;
};

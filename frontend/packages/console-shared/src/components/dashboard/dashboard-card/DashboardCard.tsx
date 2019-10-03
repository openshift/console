import * as React from 'react';
import classNames from 'classnames';
import { Card, CardProps } from '@patternfly/react-core';
import './card.scss';

const DashboardCard: React.FC<DashboardCardProps> = React.memo(
  ({ className, children, ...props }) => (
    <Card {...props} className={classNames('co-dashboard-card', className)}>
      {children}
    </Card>
  ),
);

export default DashboardCard;

type DashboardCardProps = CardProps & {
  className?: string;
  children: React.ReactNode;
};

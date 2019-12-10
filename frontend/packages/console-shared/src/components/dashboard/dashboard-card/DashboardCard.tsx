import * as React from 'react';
import classNames from 'classnames';
import { Card, CardProps } from '@patternfly/react-core';
import './card.scss';

const DashboardCard: React.FC<DashboardCardProps> = React.memo(
  ({ className, children, gradient, ...props }) => (
    <Card
      {...props}
      className={classNames(
        'co-dashboard-card',
        { 'co-dashboard-card--gradient': gradient },
        className,
      )}
    >
      {children}
    </Card>
  ),
);

export default DashboardCard;

type DashboardCardProps = CardProps & {
  className?: string;
  children: React.ReactNode;
  gradient?: boolean;
};

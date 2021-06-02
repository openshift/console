import * as React from 'react';
import { Card, CardProps } from '@patternfly/react-core';
import classNames from 'classnames';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import './card.scss';

const DashboardCard = withFallback<DashboardCardProps>(
  React.memo(({ className, children, gradient, ...props }) => (
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
  )),
);

export default DashboardCard;

type DashboardCardProps = CardProps & {
  className?: string;
  children: React.ReactNode;
  gradient?: boolean;
};

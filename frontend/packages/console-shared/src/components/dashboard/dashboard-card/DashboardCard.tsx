import * as React from 'react';
import { Card } from '@patternfly/react-core';
import classNames from 'classnames';
import { DashboardCardProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
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

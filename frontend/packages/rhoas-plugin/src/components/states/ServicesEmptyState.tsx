import * as React from 'react';
import { Button, EmptyState, EmptyStateIcon, Title } from '@patternfly/react-core';
import { history } from '@console/internal/components/utils';

type ServicesEmptyStateProps = {
  title: string;
  message?: string;
  actionLabel: string;
  icon?: React.ComponentClass;
  iconClass?: string;
};

export const ServicesEmptyState = ({
  title,
  message,
  actionLabel,
  icon,
  iconClass,
}: ServicesEmptyStateProps) => (
  <EmptyState>
    <EmptyStateIcon className={iconClass} icon={icon} />
    <Title headingLevel="h4" size="lg">
      {title}
    </Title>
    {message || (
      <Title headingLevel="h5" size="md">
        {message}
      </Title>
    )}
    <Button variant="link" onClick={history.goBack}>
      {actionLabel}
    </Button>
  </EmptyState>
);

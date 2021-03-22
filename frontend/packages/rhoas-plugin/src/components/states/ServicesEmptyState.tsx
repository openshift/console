import * as React from 'react';
import { Button, EmptyState, EmptyStateIcon, Title } from '@patternfly/react-core';
import { history } from '@console/internal/components/utils';

type ServicesEmptyStateProps = {
  title: string;
  actionLabel: string;
  icon?: React.ComponentClass;
};

export const ServicesEmptyState = ({ title, actionLabel, icon }: ServicesEmptyStateProps) => {
  return (
    <EmptyState>
      <EmptyStateIcon icon={icon} />
      <Title headingLevel="h4" size="lg">
        {title}
      </Title>
      <Button variant="link" onClick={history.goBack}>
        {actionLabel}
      </Button>
    </EmptyState>
  );
};

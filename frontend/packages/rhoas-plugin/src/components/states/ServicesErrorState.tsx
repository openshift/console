import * as React from 'react';
import { Button, EmptyState, EmptyStateIcon, Title } from '@patternfly/react-core';
import ErrorCircle from '@patternfly/react-icons/dist/js/icons/error-circle-o-icon';

import { history } from '@console/internal/components/utils';

type ServicesEmptyStateProps = {
  title: string;
  message: string
  actionInfo?: string;
  action?: () => void;
};

export const ServicesErrorState = ({
  title,
  message,
  actionInfo,
  action,
}: ServicesEmptyStateProps) => {
  if (!action) {
    action = () => {
      history.goBack();
    };
  }

  return (
    <EmptyState>
      <EmptyStateIcon icon={ErrorCircle} />
      <Title headingLevel="h4" size="lg">
        {title}
      </Title>
      <Title headingLevel="h5" size="md">
        {message}
      </Title>
      <Button variant="link" onClick={action}>
        {actionInfo}
      </Button>
    </EmptyState>
  );
};

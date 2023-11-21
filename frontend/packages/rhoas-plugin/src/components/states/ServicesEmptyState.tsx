import * as React from 'react';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { history } from '@console/internal/components/utils';

type ServicesEmptyStateProps = {
  title: string;
  message?: string | JSX.Element;
  actionLabel?: string;
  action?: () => void;
  icon?: React.ComponentClass | JSX.Element | any;
  iconClass?: string;
};

export const ServicesEmptyState = ({
  title,
  message,
  action,
  actionLabel,
  icon,
  iconClass,
}: ServicesEmptyStateProps) => (
  <EmptyState>
    <EmptyStateHeader
      titleText={<>{title}</>}
      icon={<EmptyStateIcon className={iconClass} icon={icon} />}
      headingLevel="h4"
    />
    <EmptyStateFooter>
      {message && <EmptyStateBody>{message}</EmptyStateBody>}
      {action && (
        <Button variant="link" onClick={action || history.goBack}>
          {actionLabel}
        </Button>
      )}
    </EmptyStateFooter>
  </EmptyState>
);

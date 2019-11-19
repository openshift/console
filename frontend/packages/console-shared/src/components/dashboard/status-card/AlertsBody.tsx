import * as React from 'react';
import {
  EmptyState,
  EmptyStateVariant,
  EmptyStateIcon,
  EmptyStateBody,
} from '@patternfly/react-core';
import { UnknownIcon, CheckCircleIcon } from '@patternfly/react-icons';

const AlertsBody: React.FC<AlertsBodyProps> = ({
  isLoading = false,
  error = false,
  children,
  emptyMessage,
}) => {
  let body: React.ReactNode;
  if (error) {
    body = (
      <EmptyState variant={EmptyStateVariant.full} className="co-status-card__alerts-msg">
        <EmptyStateIcon className="co-status-card__alerts-icon" icon={UnknownIcon} />
        <EmptyStateBody>Alerts could not be loaded.</EmptyStateBody>
      </EmptyState>
    );
  } else if (isLoading) {
    body = (
      <div className="co-status-card__alerts-body">
        <div className="co-status-card__alert-item co-status-card__alert-item--loading">
          <div className="skeleton-status-alerts" />
          <div className="skeleton-status-alerts" />
        </div>
      </div>
    );
  } else if (!children) {
    body = (
      <EmptyState variant={EmptyStateVariant.full} className="co-status-card__alerts-msg">
        <EmptyStateIcon className="co-status-card__alerts-icon" icon={CheckCircleIcon} />
        <EmptyStateBody>{emptyMessage}</EmptyStateBody>
      </EmptyState>
    );
  }
  return (
    <div className="co-dashboard-card__body--no-padding co-status-card__alerts-body">
      {body || children}
    </div>
  );
};

export default AlertsBody;

type AlertsBodyProps = {
  isLoading?: boolean;
  error?: boolean;
  children?: React.ReactNode;
  emptyMessage: string;
};

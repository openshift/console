import * as React from 'react';
import {
  EmptyState,
  EmptyStateVariant,
  EmptyStateIcon,
  EmptyStateBody,
  Button,
} from '@patternfly/react-core';
import { UnknownIcon, CheckCircleIcon } from '@patternfly/react-icons';
import { Alert, alertURL } from '@console/internal/components/monitoring';
import AlertItem from './AlertItem';
import { getAlertSeverity, FilterType } from './utils';
import { SelectedFilters } from './use-filter-hook';

const EmptyAlerts: React.FC<EmptyAlertsProps> = ({ children, error }) => (
  <div className="co-dashboard-card__body--no-padding co-status-card__alerts-body">
    <EmptyState variant={EmptyStateVariant.full} className="co-status-card__alerts-msg">
      <EmptyStateIcon
        className="co-status-card__alerts-icon"
        icon={error ? UnknownIcon : CheckCircleIcon}
      />
      <EmptyStateBody>{children}</EmptyStateBody>
    </EmptyState>
  </div>
);

const LoadingAlerts: React.FC = () => (
  <div className="co-dashboard-card__body--no-padding co-status-card__alerts-body">
    <div className="co-status-card__alert-item co-status-card__alert-item--loading">
      <div className="skeleton-status-alerts" />
      <div className="skeleton-status-alerts" />
    </div>
  </div>
);

const AlertsBody: React.FC<AlertsBodyProps> = ({
  isLoading = false,
  error = false,
  emptyMessage = 'No alerts or messages',
  alerts,
  selectedFilters,
  resetFilters,
  messages,
}) => {
  if (error) {
    return <EmptyAlerts error>Alerts could not be loaded.</EmptyAlerts>;
  }
  if (isLoading) {
    return <LoadingAlerts />;
  }
  if (!alerts || alerts.length === 0) {
    return <EmptyAlerts>{emptyMessage}</EmptyAlerts>;
  }
  const filteredAlerts = selectedFilters[FilterType.Type].includes('alert')
    ? alerts.filter((alert) =>
        selectedFilters[FilterType.Severity].includes(getAlertSeverity(alert)),
      )
    : [];

  const filteredMessages = selectedFilters[FilterType.Type].includes('message') ? messages : [];
  if (filteredAlerts.length === 0 && (!messages || filteredMessages.length === 0)) {
    return (
      <EmptyAlerts error>
        <div>No alerts or messages match the current filters</div>
        <Button variant="link" onClick={resetFilters}>
          Reset filter
        </Button>
      </EmptyAlerts>
    );
  }
  return (
    <div className="co-dashboard-card__body--no-padding co-status-card__alerts-body">
      {filteredMessages}
      {filteredAlerts.map((alert) => (
        <AlertItem key={alertURL(alert, alert.rule.id)} alert={alert} />
      ))}
    </div>
  );
};

export default AlertsBody;

type AlertsBodyProps = {
  isLoading?: boolean;
  error?: boolean;
  emptyMessage?: React.ReactNode;
  alerts?: Alert[];
  selectedFilters?: SelectedFilters;
  messages?: React.ReactNode[];
  resetFilters?: () => void;
};

type EmptyAlertsProps = {
  children: React.ReactNode;
  error?: boolean;
};

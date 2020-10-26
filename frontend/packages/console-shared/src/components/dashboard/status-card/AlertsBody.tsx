import * as React from 'react';
import {
  EmptyState,
  EmptyStateVariant,
  EmptyStateIcon,
  EmptyStateBody,
} from '@patternfly/react-core';
import { UnknownIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

const AlertsBody: React.FC<AlertsBodyProps> = ({ error = false, children }) => {
  const { t } = useTranslation();
  return (
    (error || !!React.Children.toArray(children).length) && (
      <div className="co-dashboard-card__body--no-padding co-status-card__alerts-body co-dashboard-card__body--top-margin">
        {error ? (
          <EmptyState variant={EmptyStateVariant.full} className="co-status-card__alerts-msg">
            <EmptyStateIcon className="co-status-card__alerts-icon" icon={UnknownIcon} />
            <EmptyStateBody>{t('dashboard~Alerts could not be loaded.')}</EmptyStateBody>
          </EmptyState>
        ) : (
          children
        )}
      </div>
    )
  );
};
export default AlertsBody;

type AlertsBodyProps = {
  error?: boolean;
  children?: React.ReactNode;
};

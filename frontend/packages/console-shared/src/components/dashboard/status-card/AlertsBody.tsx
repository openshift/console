import * as React from 'react';
import {
  EmptyState,
  EmptyStateVariant,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateHeader,
} from '@patternfly/react-core';
import { UnknownIcon } from '@patternfly/react-icons/dist/esm/icons/unknown-icon';
import { useTranslation } from 'react-i18next';
import { AlertsBodyProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';

const AlertsBody: React.FC<AlertsBodyProps> = ({ error = false, children }) => {
  const { t } = useTranslation();
  return (
    (error || !!React.Children.toArray(children).length) && (
      <div className="co-status-card__alerts-body">
        {error ? (
          <EmptyState variant={EmptyStateVariant.full} className="co-status-card__alerts-msg">
            <EmptyStateHeader
              icon={<EmptyStateIcon className="co-status-card__alerts-icon" icon={UnknownIcon} />}
            />
            <EmptyStateBody>{t('console-shared~Alerts could not be loaded.')}</EmptyStateBody>
          </EmptyState>
        ) : (
          children
        )}
      </div>
    )
  );
};
export default AlertsBody;

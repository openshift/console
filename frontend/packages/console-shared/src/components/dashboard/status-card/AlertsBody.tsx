import type { FC } from 'react';
import { Children } from 'react';
import { EmptyState, EmptyStateVariant, EmptyStateBody } from '@patternfly/react-core';
import { UnknownIcon } from '@patternfly/react-icons/dist/esm/icons/unknown-icon';
import { useTranslation } from 'react-i18next';
import type { AlertsBodyProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';

const AlertsBody: FC<AlertsBodyProps> = ({ error = false, children }) => {
  const { t } = useTranslation();
  return (
    (error || !!Children.toArray(children).length) && (
      <div className="co-status-card__alerts-body">
        {error ? (
          <EmptyState
            icon={UnknownIcon}
            variant={EmptyStateVariant.full}
            className="co-status-card__alerts-msg"
          >
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

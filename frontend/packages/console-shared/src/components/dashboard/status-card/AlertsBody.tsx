import type { FC } from 'react';
import { Children } from 'react';
import { EmptyState, EmptyStateVariant, EmptyStateBody } from '@patternfly/react-core';
import { RhStandardQuestionMarkIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import type { AlertsBodyProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';

const AlertsBody: FC<AlertsBodyProps> = ({ error = false, children }) => {
  const { t } = useTranslation('console-shared');
  return (
    (error || !!Children.toArray(children).length) && (
      <div className="co-status-card__alerts-body">
        {error ? (
          <EmptyState
            icon={RhStandardQuestionMarkIcon}
            variant={EmptyStateVariant.full}
            className="co-status-card__alerts-msg"
          >
            <EmptyStateBody>{t('Alerts could not be loaded.')}</EmptyStateBody>
          </EmptyState>
        ) : (
          children
        )}
      </div>
    )
  );
};
export default AlertsBody;

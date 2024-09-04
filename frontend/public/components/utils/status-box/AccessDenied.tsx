import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { BanIcon } from '@patternfly/react-icons';
import {
  Alert,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
} from '@patternfly/react-core';

export const AccessDenied: React.FC = ({ children }) => {
  const { t } = useTranslation();
  return (
    <EmptyState data-test="access-denied">
      <EmptyStateHeader
        icon={<EmptyStateIcon icon={BanIcon} />}
        titleText={t('public~Restricted Access')}
      />
      <EmptyStateBody>
        {t("public~You don't have access to this section due to cluster policy.")}
        {children && (
          <Alert isInline className="co-alert" variant="danger" title={t('public~Error details')}>
            {children}
          </Alert>
        )}
      </EmptyStateBody>
    </EmptyState>
  );
};
AccessDenied.displayName = 'AccessDenied';

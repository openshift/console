import * as React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  EmptyStateHeader,
} from '@patternfly/react-core';
import { ChartLineIcon } from '@patternfly/react-icons/dist/esm/icons/chart-line-icon';
import { useTranslation } from 'react-i18next';

const EmptyStateQuery: React.FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState variant={EmptyStateVariant.full}>
      <EmptyStateHeader icon={<EmptyStateIcon icon={ChartLineIcon} />} />
      <EmptyStateBody>
        {t('devconsole~Select a query or enter your own to view metrics for this Project')}
      </EmptyStateBody>
    </EmptyState>
  );
};

export default EmptyStateQuery;

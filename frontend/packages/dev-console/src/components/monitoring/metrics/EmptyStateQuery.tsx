import * as React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { ChartLineIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

const EmptyStateQuery: React.FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState variant={EmptyStateVariant.full}>
      <EmptyStateIcon icon={ChartLineIcon} />
      <EmptyStateBody>
        {t('devconsole~Select a query or enter your own to view metrics for this Project')}
      </EmptyStateBody>
    </EmptyState>
  );
};

export default EmptyStateQuery;

import * as React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { ChartLineIcon } from '@patternfly/react-icons';

const EmptyStateQuery: React.FC = () => (
  <EmptyState variant={EmptyStateVariant.full}>
    <EmptyStateIcon icon={ChartLineIcon} />
    <EmptyStateBody>
      Select a query or enter your own to view metrics for this project
    </EmptyStateBody>
  </EmptyState>
);

export default EmptyStateQuery;

import * as React from 'react';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateSecondaryActions,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';

type CatalogEmptyStateProps = {
  keyword: string;
  onClear: () => void;
};

const CatalogEmptyState: React.FC<CatalogEmptyStateProps> = ({ keyword, onClear }) => {
  return (
    <EmptyState variant={EmptyStateVariant.full}>
      <Title headingLevel="h2" size="lg">
        No matching results for &quot;{keyword}&quot;
      </Title>
      <EmptyStateBody>No results match this search</EmptyStateBody>
      <EmptyStateSecondaryActions>
        <Button variant="link" onClick={onClear} data-test-id="catalog-clear-filters">
          Clear search
        </Button>
      </EmptyStateSecondaryActions>
    </EmptyState>
  );
};

export default CatalogEmptyState;

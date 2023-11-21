import * as React from 'react';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  EmptyStateActions,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { useTranslation } from 'react-i18next';

type CatalogEmptyStateProps = {
  onClear: () => void;
};

const CatalogEmptyState: React.FC<CatalogEmptyStateProps> = ({ onClear }) => {
  const { t } = useTranslation();
  return (
    <EmptyState variant={EmptyStateVariant.full}>
      <EmptyStateHeader
        titleText={<>{t('console-shared~No results found')}</>}
        icon={<EmptyStateIcon icon={SearchIcon} />}
        headingLevel="h2"
      />
      <EmptyStateBody>
        {t(
          'console-shared~No results match the filter criteria. Remove filters or clear all filters to show results.',
        )}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button variant="link" onClick={onClear} data-test-id="catalog-clear-filters">
            {t('console-shared~Clear all filters')}
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default CatalogEmptyState;

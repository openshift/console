import * as React from 'react';
import { EmptyState, EmptyStateVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Table, TableProps } from '@console/internal/components/factory';
import RepositoriesHeader from './RepositoriesHeader';
import RepositoriesRow from './RepositoriesRow';

const RepositoriesList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();

  const EmptyMsg = () => (
    <EmptyState
      headingLevel="h4"
      titleText={<>{t('helm-plugin~No repositories found')}</>}
      variant={EmptyStateVariant.lg}
    />
  );
  return (
    <Table
      {...props}
      EmptyMsg={EmptyMsg}
      aria-label={t('helm-plugin~Helm Chart Repositories')}
      Header={RepositoriesHeader(t)}
      Row={RepositoriesRow}
      virtualize
    />
  );
};

export default RepositoriesList;

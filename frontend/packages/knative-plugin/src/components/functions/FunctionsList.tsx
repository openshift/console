import * as React from 'react';
import { EmptyState, EmptyStateVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Table, TableProps } from '@console/internal/components/factory';
import ServiceHeader from '../services/ServiceHeader';
import FunctionRow from './FunctionRow';

const FunctionsList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();
  const EmptyMsg = () => (
    <EmptyState variant={EmptyStateVariant.large}>
      {t('knative-plugin~No Functions found')}
    </EmptyState>
  );
  return (
    <Table
      {...props}
      aria-label={t('knative-plugin~Functions')}
      Header={ServiceHeader(t)}
      Row={FunctionRow}
      virtualize
      EmptyMsg={EmptyMsg}
    />
  );
};

export default FunctionsList;

import * as React from 'react';
import { Table } from '@console/internal/components/factory';
import { RepositoryModel } from '../../../models';
import { RepositoryKind } from '../types';
import RepositoryHeader from './RepositoryHeader';
import RepositoryRow from './RepositoryRow';

export interface RepositoryListProps {
  data?: RepositoryKind[];
}

const RepositoryList: React.FC<RepositoryListProps> = (props) => (
  <Table
    {...props}
    aria-label={RepositoryModel.labelPluralKey}
    Header={RepositoryHeader}
    Row={RepositoryRow}
    virtualize
  />
);

export default RepositoryList;

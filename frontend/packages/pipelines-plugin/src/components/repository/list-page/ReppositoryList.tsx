import * as React from 'react';
import { Table } from '@console/internal/components/factory';
import { RepositoryModel } from '../../../models';
import { useGetTaskRuns } from '../../pipelineruns/hooks/useTektonResults';
import { RepositoryKind } from '../types';
import RepositoryHeader from './RepositoryHeader';
import RepositoryRow from './RepositoryRow';

export interface RepositoryListProps {
  data?: RepositoryKind[];
  namespace: string;
}

const RepositoryList: React.FC<RepositoryListProps> = (props) => {
  const [taskRuns, taskRunsLoaded] = useGetTaskRuns(props.namespace);

  return (
    <Table
      {...props}
      aria-label={RepositoryModel.labelPluralKey}
      Header={RepositoryHeader}
      Row={RepositoryRow}
      customData={{ taskRuns: taskRunsLoaded ? taskRuns : [] }}
      virtualize
    />
  );
};

export default RepositoryList;

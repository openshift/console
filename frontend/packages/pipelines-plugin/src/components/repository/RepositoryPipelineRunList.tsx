import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { Table } from '@console/internal/components/factory';
import { PipelineRunModel } from '../../models';
import RepositoryPipelineRunHeader from './RepositoryPipelineRunHeader';
import RepositoryPipelineRunRow from './RepositoryPipelineRunRow';

export const RepositoryPipelineRunList: React.FC = (props) => {
  const { t } = useTranslation();

  return (
    <Table
      {...props}
      aria-label={t(PipelineRunModel.labelPluralKey)}
      defaultSortField="status.startTime"
      defaultSortOrder={SortByDirection.desc}
      Header={RepositoryPipelineRunHeader}
      Row={RepositoryPipelineRunRow}
      virtualize
    />
  );
};

export default RepositoryPipelineRunList;

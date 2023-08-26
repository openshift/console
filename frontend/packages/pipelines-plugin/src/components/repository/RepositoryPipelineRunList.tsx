import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { Table } from '@console/internal/components/factory';
import { PipelineRunModel } from '../../models';
import { usePipelineOperatorVersion } from '../pipelines/utils/pipeline-operator';
import RepositoryPipelineRunHeader from './RepositoryPipelineRunHeader';
import RepositoryPipelineRunRow from './RepositoryPipelineRunRow';

type RepositoryPipelineRunListProps = {
  namespace: string;
};

export const RepositoryPipelineRunList: React.FC<RepositoryPipelineRunListProps> = (props) => {
  const { t } = useTranslation();
  const operatorVersion = usePipelineOperatorVersion(props.namespace);
  return (
    <Table
      {...props}
      aria-label={t(PipelineRunModel.labelPluralKey)}
      defaultSortField="status.startTime"
      defaultSortOrder={SortByDirection.desc}
      Header={RepositoryPipelineRunHeader}
      Row={RepositoryPipelineRunRow}
      customData={operatorVersion}
      virtualize
    />
  );
};

export default RepositoryPipelineRunList;

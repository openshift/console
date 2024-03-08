import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { Table } from '@console/internal/components/factory';
import { PipelineModel } from '../../../models';
import { PropPipelineData } from '../../../utils/pipeline-augment';
import { useGetTaskRuns } from '../../pipelineruns/hooks/useTektonResults';
import PipelineHeader from './PipelineHeader';
import PipelineRow from './PipelineRow';

export interface PipelineListProps {
  data?: PropPipelineData[];
  namespace: string;
}

const PipelineList: React.FC<PipelineListProps> = (props) => {
  const { t } = useTranslation();
  const [taskRuns, taskRunsLoaded] = useGetTaskRuns(props.namespace);
  return (
    <Table
      {...props}
      defaultSortField="latestRun.status.startTime"
      defaultSortOrder={SortByDirection.desc}
      aria-label={t(PipelineModel.labelPluralKey)}
      Header={PipelineHeader}
      Row={PipelineRow}
      customData={{ taskRuns: taskRunsLoaded ? taskRuns : [], taskRunsLoaded }}
      virtualize
    />
  );
};

export default PipelineList;

import * as React from 'react';
import { Table } from '@console/internal/components/factory';
import { useFlag } from '@console/shared/src/hooks/flag';
import { RepositoryModel } from '../../../models';
import { usePipelineRuns } from '../../pipelineruns/hooks/usePipelineRuns';
import { useTaskRuns } from '../../pipelineruns/hooks/useTaskRuns';
import { FLAG_PIPELINES_OPERATOR_VERSION_1_16 } from '../../pipelines/const';
import { RepositoryKind } from '../types';
import RepositoryHeader from './RepositoryHeader';
import RepositoryRow from './RepositoryRow';

export interface RepositoryListProps {
  data?: RepositoryKind[];
  namespace: string;
}

const RepositoryList: React.FC<RepositoryListProps> = (props) => {
  const IS_PIPELINE_OPERATOR_VERSION_1_16 = useFlag(FLAG_PIPELINES_OPERATOR_VERSION_1_16);
  const [taskRuns, taskRunsLoaded] = useTaskRuns(
    props.namespace,
    undefined,
    undefined,
    undefined,
    IS_PIPELINE_OPERATOR_VERSION_1_16,
  );
  const [pipelineRuns, pipelineRunsLoaded] = usePipelineRuns(
    props.namespace,
    undefined,
    IS_PIPELINE_OPERATOR_VERSION_1_16,
  );
  return (
    <Table
      {...props}
      aria-label={RepositoryModel.labelPluralKey}
      Header={RepositoryHeader}
      Row={RepositoryRow}
      customData={{
        taskRuns: taskRunsLoaded ? taskRuns : [],
        pipelineRuns: pipelineRunsLoaded ? pipelineRuns : [],
        taskRunsLoaded,
      }}
      virtualize
    />
  );
};

export default RepositoryList;

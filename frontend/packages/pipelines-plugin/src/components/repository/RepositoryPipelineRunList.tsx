import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { Table } from '@console/internal/components/factory';
import { useFlag } from '@console/shared/src/hooks/flag';
import { PipelineRunModel } from '../../models';
import { useTaskRuns } from '../pipelineruns/hooks/useTaskRuns';
import { FLAG_PIPELINES_OPERATOR_VERSION_1_16 } from '../pipelines/const';
import { usePipelineOperatorVersion } from '../pipelines/utils/pipeline-operator';
import RepositoryPipelineRunHeader from './RepositoryPipelineRunHeader';
import RepositoryPipelineRunRow from './RepositoryPipelineRunRow';

type RepositoryPipelineRunListProps = {
  namespace: string;
};

export const RepositoryPipelineRunList: React.FC<RepositoryPipelineRunListProps> = (props) => {
  const { t } = useTranslation();
  const operatorVersion = usePipelineOperatorVersion(props.namespace);
  const IS_PIPELINE_OPERATOR_VERSION_1_16 = useFlag(FLAG_PIPELINES_OPERATOR_VERSION_1_16);
  const [taskRuns, taskRunsLoaded] = useTaskRuns(
    props.namespace,
    undefined,
    undefined,
    undefined,
    IS_PIPELINE_OPERATOR_VERSION_1_16,
  );
  return (
    <Table
      {...props}
      aria-label={t(PipelineRunModel.labelPluralKey)}
      defaultSortField="status.startTime"
      defaultSortOrder={SortByDirection.desc}
      Header={RepositoryPipelineRunHeader}
      Row={RepositoryPipelineRunRow}
      customData={{
        operatorVersion,
        taskRuns: taskRunsLoaded ? taskRuns : [],
        taskRunsLoaded,
      }}
      virtualize
    />
  );
};

export default RepositoryPipelineRunList;

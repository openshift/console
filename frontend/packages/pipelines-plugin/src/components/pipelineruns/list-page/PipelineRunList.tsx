import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { Table } from '@console/internal/components/factory';
import { PipelineRunModel } from '../../../models';
import { usePipelineOperatorVersion } from '../../pipelines/utils/pipeline-operator';
import { useTaskRuns } from '../../taskruns/useTaskRuns';
import PipelineRunHeader from './PipelineRunHeader';
import PipelineRunRow from './PipelineRunRow';

type PipelineRunListProps = {
  namespace: string;
};

export const PipelineRunList: React.FC<PipelineRunListProps> = (props) => {
  const { t } = useTranslation();
  const operatorVersion = usePipelineOperatorVersion(props.namespace);
  const [taskRuns, taskRunsLoaded] = useTaskRuns(props.namespace);

  return (
    <Table
      {...props}
      aria-label={t(PipelineRunModel.labelPluralKey)}
      defaultSortField="status.startTime"
      defaultSortOrder={SortByDirection.desc}
      Header={PipelineRunHeader}
      Row={PipelineRunRow}
      customData={{ operatorVersion, taskRuns: taskRunsLoaded ? taskRuns : [] }}
      virtualize
    />
  );
};

export default PipelineRunList;

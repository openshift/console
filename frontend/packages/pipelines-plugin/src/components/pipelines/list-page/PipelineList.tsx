import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { Table } from '@console/internal/components/factory';
import { PipelineModel } from '../../../models';
import { PropPipelineData } from '../../../utils/pipeline-augment';
import PipelineHeader from './PipelineHeader';
import PipelineRow from './PipelineRow';

export interface PipelineListProps {
  data?: PropPipelineData[];
}

const PipelineList: React.FC<PipelineListProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      defaultSortField="latestRun.status.startTime"
      defaultSortOrder={SortByDirection.desc}
      aria-label={t(PipelineModel.labelPluralKey)}
      Header={PipelineHeader}
      Row={PipelineRow}
      virtualize
    />
  );
};

export default PipelineList;

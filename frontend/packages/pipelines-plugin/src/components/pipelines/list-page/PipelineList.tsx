import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SortByDirection } from '@patternfly/react-table';
import { Table } from '@console/internal/components/factory';
import { PropPipelineData } from '../../../utils/pipeline-augment';
import { PipelineModel } from '../../../models';
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
      Header={PipelineHeader(t)}
      Row={PipelineRow}
      virtualize
    />
  );
};

export default PipelineList;

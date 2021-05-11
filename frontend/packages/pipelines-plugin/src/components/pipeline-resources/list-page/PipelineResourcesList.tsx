import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from '@console/internal/components/factory';
import { PipelineResourceModel } from '../../../models';
import PipelineResourcesHeader from './PipelineResourcesHeader';
import PipelineResourcesRow from './PipelineResourcesRow';

const PipelineResourcesList: React.FC = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t(PipelineResourceModel.labelPluralKey)}
      Header={PipelineResourcesHeader()}
      Row={PipelineResourcesRow}
      virtualize
    />
  );
};

export default PipelineResourcesList;

import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { PipelineRunKind } from '../../../types';
import PipelineRunCustomDetails from './PipelineRunCustomDetails';
import PipelineRunVisualization from './PipelineRunVisualization';

export interface PipelineRunDetailsSectionProps {
  pipelineRun: PipelineRunKind;
}

const PipelineRunDetailsSection: React.FC<PipelineRunDetailsSectionProps> = ({ pipelineRun }) => {
  const { t } = useTranslation();
  return (
    <>
      <SectionHeading text={t('pipelines-plugin~PipelineRun details')} />
      <PipelineRunVisualization pipelineRun={pipelineRun} />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={pipelineRun} />
        </GridItem>
        <GridItem sm={6} className="odc-pipeline-run-details__customDetails">
          <PipelineRunCustomDetails pipelineRun={pipelineRun} />
        </GridItem>
      </Grid>
    </>
  );
};

export default PipelineRunDetailsSection;

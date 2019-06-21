import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { viewYamlComponent } from '@console/internal/components//utils/horizontal-nav';
import { PipelineRunDetails } from './PipelineRunDetails';

const PipelineRunDetailsPage: React.FC<DetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    pages={[navFactory.details(PipelineRunDetails), navFactory.editYaml(viewYamlComponent)]}
  />
);

export default PipelineRunDetailsPage;

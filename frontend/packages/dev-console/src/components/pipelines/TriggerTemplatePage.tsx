import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import TriggerTemplateDetails from './detail-page-tabs/TriggerTemplateDetails';

const TriggerTemplatePage: React.FC<DetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    menuActions={Kebab.factory.common}
    pages={[navFactory.details(TriggerTemplateDetails), navFactory.editYaml()]}
  />
);

export default TriggerTemplatePage;

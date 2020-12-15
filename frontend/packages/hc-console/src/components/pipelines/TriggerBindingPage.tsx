import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Kebab, navFactory, viewYamlComponent } from '@console/internal/components/utils';
import TriggerBindingDetails from './detail-page-tabs/TriggerBindingDetails';

const TriggerBindingPage: React.FC<DetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    menuActions={Kebab.factory.common}
    pages={[navFactory.details(TriggerBindingDetails), navFactory.editYaml(viewYamlComponent)]}
  />
);

export default TriggerBindingPage;

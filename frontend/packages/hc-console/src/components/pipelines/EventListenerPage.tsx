import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Kebab, navFactory, viewYamlComponent } from '@console/internal/components/utils';
import EventListenerDetails from './detail-page-tabs/EventListenerDetails';

const EventListenerPage: React.FC<DetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    menuActions={Kebab.factory.common}
    pages={[navFactory.details(EventListenerDetails), navFactory.editYaml(viewYamlComponent)]}
  />
);

export default EventListenerPage;

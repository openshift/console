import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import EventListenerDetails from './detail-page-tabs/EventListenerDetails';
import { useTriggersBreadcrumbsFor } from './hooks';

const EventListenerPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj, match } = props;
  const breadcrumbsFor = useTriggersBreadcrumbsFor(kindObj, match);
  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={() => breadcrumbsFor}
      menuActions={Kebab.factory.common}
      pages={[navFactory.details(EventListenerDetails), navFactory.editYaml()]}
    />
  );
};

export default EventListenerPage;

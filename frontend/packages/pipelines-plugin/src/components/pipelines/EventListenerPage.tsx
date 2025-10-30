import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { useTriggersTechPreviewBadge } from '../../utils/hooks';
import EventListenerDetails from './detail-page-tabs/EventListenerDetails';
import { useTriggersBreadcrumbsFor } from './hooks';

const EventListenerPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj } = props;
  const breadcrumbsFor = useTriggersBreadcrumbsFor(kindObj);
  const badge = useTriggersTechPreviewBadge(props.namespace);

  return (
    <DetailsPage
      {...props}
      badge={badge}
      breadcrumbsFor={() => breadcrumbsFor}
      pages={[navFactory.details(EventListenerDetails), navFactory.editYaml()]}
    />
  );
};

export default EventListenerPage;

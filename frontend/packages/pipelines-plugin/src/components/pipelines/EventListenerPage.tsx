import * as React from 'react';
import { useCommonResourceActions } from '@console/app/src/actions/hooks/useCommonResourceActions';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { EventListenerModel } from '../../models';
import { useTriggersTechPreviewBadge } from '../../utils/hooks';
import EventListenerDetails from './detail-page-tabs/EventListenerDetails';
import { useTriggersBreadcrumbsFor } from './hooks';

const EventListenerPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj } = props;
  const breadcrumbsFor = useTriggersBreadcrumbsFor(kindObj);
  const badge = useTriggersTechPreviewBadge(props.namespace);
  const commonActions = useCommonResourceActions(EventListenerModel, props.obj);

  return (
    <DetailsPage
      {...props}
      badge={badge}
      breadcrumbsFor={() => breadcrumbsFor}
      menuActions={commonActions}
      pages={[navFactory.details(EventListenerDetails), navFactory.editYaml()]}
    />
  );
};

export default EventListenerPage;

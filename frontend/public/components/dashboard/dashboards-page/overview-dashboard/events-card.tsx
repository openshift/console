import * as React from 'react';

import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import EventsBody from '@console/shared/src/components/dashboard/events-card/EventsBody';
import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import { EventModel } from '../../../../models';
import { FirehoseResource, FirehoseResult } from '../../../utils';
import { EventKind } from '../../../../module/k8s';

const eventsResource: FirehoseResource = { isList: true, kind: EventModel.kind, prop: 'events' };

const EventsCard_: React.FC<DashboardItemProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  React.useEffect(() => {
    watchK8sResource(eventsResource);
    return () => stopWatchK8sResource(eventsResource);
  }, [watchK8sResource, stopWatchK8sResource]);
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Events</DashboardCardTitle>
        <DashboardCardLink to="/k8s/all-namespaces/events">View all</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody>
        <EventsBody events={resources.events as FirehoseResult<EventKind[]>} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export const EventsCard = withDashboardResources(EventsCard_);

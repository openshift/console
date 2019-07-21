import * as React from 'react';

import { DashboardCard, DashboardCardHeader, DashboardCardBody, DashboardCardTitle, DashboardCardLink } from '../../dashboard/dashboard-card';
import { EventsBody } from '../../dashboard/events-card/events-body';
import { DashboardItemProps, withDashboardResources } from '../with-dashboard-resources';
import { EventModel } from '../../../models';
import { FirehoseResource, FirehoseResult } from '../../utils';
import { EventKind } from '../../../module/k8s';

const eventsResource: FirehoseResource = {isList: true, kind: EventModel.kind, prop: 'events'};

const EventsCard_: React.FC<DashboardItemProps> = ({ watchK8sResource, stopWatchK8sResource, resources }) => {
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

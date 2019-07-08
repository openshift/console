import * as React from 'react';
import * as _ from 'lodash';

import { DashboardCard } from '@console/internal/components/dashboard/dashboard-card/card';
import { DashboardCardBody } from '@console/internal/components/dashboard/dashboard-card/card-body';
import { DashboardCardHeader } from '@console/internal/components/dashboard/dashboard-card/card-header';
import { DashboardCardTitle } from '@console/internal/components/dashboard/dashboard-card/card-title';
import { EventKind } from '@console/internal/module/k8s';
import { EventsBody } from '@console/internal/components/dashboard/events-card/events-body';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { getNamespace } from '@console/shared';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import {
  EventModel,
  PersistentVolumeClaimModel,
  PersistentVolumeModel,
} from '@console/internal/models';
import { CEPH_STORAGE_NAMESPACE } from '../../../constants/index';

const eventsResource: FirehoseResource = { isList: true, kind: EventModel.kind, prop: 'events' };

const ocsEventNamespaceKindFilter = (event: EventKind): boolean =>
  getNamespace(event) === CEPH_STORAGE_NAMESPACE ||
  _.get(event, 'involvedObject.kind') ===
    (PersistentVolumeClaimModel.kind || PersistentVolumeModel.kind);

const EventsCard: React.FC<DashboardItemProps> = ({
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
      </DashboardCardHeader>
      <DashboardCardBody>
        <EventsBody
          events={resources.events as FirehoseResult<EventKind[]>}
          filter={ocsEventNamespaceKindFilter}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(EventsCard);

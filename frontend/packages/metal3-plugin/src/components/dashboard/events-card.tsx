import * as React from 'react';
import * as _ from 'lodash';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { EventModel, MachineModel, NodeModel } from '@console/internal/models';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '@console/internal/components/dashboard/dashboard-card';
import { EventsBody } from '@console/internal/components/dashboard/events-card/events-body';
import {
  EventKind,
  K8sResourceKind,
  MachineKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { DashboardItemProps } from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { getName, getNamespace, getMachineNodeName } from '@console/shared';

import { getHostMachineName } from '../../selectors';
import { BaremetalHostModel } from '../../models';

const eventsResource: FirehoseResource = { isList: true, kind: EventModel.kind, prop: 'events' };
const getMachineResource = (name: string, namespace: string): FirehoseResource => ({
  isList: false,
  namespace,
  name,
  kind: referenceForModel(MachineModel),
  prop: 'machine',
});

const machesInvolvedObject = (
  kind: string,
  name: string,
  namespace: string,
  event: EventKind,
): boolean =>
  name &&
  _.isMatch(event.involvedObject, {
    kind,
    name,
    namespace,
  });

const hostEventsFilter = (host: K8sResourceKind, machine: MachineKind, event: EventKind): boolean =>
  machesInvolvedObject(BaremetalHostModel.kind, getName(host), getNamespace(host), event) ||
  machesInvolvedObject(MachineModel.kind, getName(machine), getNamespace(machine), event) ||
  machesInvolvedObject(NodeModel.kind, getMachineNodeName(machine), null, event);

export const EventsCard: React.FC<EventsCardProps> = ({
  obj,
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  const machineName = getHostMachineName(obj);
  const namespace = getNamespace(obj);
  React.useEffect(() => {
    if (machineName) {
      const machineResource = getMachineResource(machineName, namespace);
      watchK8sResource(machineResource);
    }
    watchK8sResource(eventsResource);
    return () => {
      stopWatchK8sResource(eventsResource);
      if (machineName) {
        const machineResource = getMachineResource(machineName, namespace);
        stopWatchK8sResource(machineResource);
      }
    };
  }, [watchK8sResource, stopWatchK8sResource, machineName, namespace]);
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Events</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <EventsBody
          events={resources.events as FirehoseResult<EventKind[]>}
          filter={(event) =>
            hostEventsFilter(obj, _.get(resources.machine, 'data') as MachineKind, event)
          }
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

type EventsCardProps = DashboardItemProps & {
  obj: K8sResourceKind;
};

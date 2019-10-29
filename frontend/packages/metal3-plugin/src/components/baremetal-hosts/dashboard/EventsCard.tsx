import * as React from 'react';
import * as _ from 'lodash';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { EventModel, MachineModel, NodeModel } from '@console/internal/models';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import EventsBody from '@console/shared/src/components/dashboard/events-card/EventsBody';
import { EventKind, MachineKind, referenceForModel } from '@console/internal/module/k8s';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { getName, getNamespace, getMachineNodeName } from '@console/shared';
import { getHostMachineName } from '../../../selectors';
import { BareMetalHostModel } from '../../../models';
import { BareMetalHostKind } from '../../../types';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';

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

const hostEventsFilter = (
  host: BareMetalHostKind,
  machine: MachineKind,
  event: EventKind,
): boolean =>
  machesInvolvedObject(BareMetalHostModel.kind, getName(host), getNamespace(host), event) ||
  machesInvolvedObject(MachineModel.kind, getName(machine), getNamespace(machine), event) ||
  machesInvolvedObject(NodeModel.kind, getMachineNodeName(machine), null, event);

const EventsCard: React.FC<EventsCardProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  const { obj } = React.useContext(BareMetalHostDashboardContext);
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

export default withDashboardResources(EventsCard);

type EventsCardProps = DashboardItemProps & {
  obj: BareMetalHostKind;
};

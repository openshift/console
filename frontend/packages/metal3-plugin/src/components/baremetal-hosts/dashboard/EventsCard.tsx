import * as React from 'react';
import * as _ from 'lodash';
import {
  FirehoseResource,
  FirehoseResult,
  ResourceLink,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import { EventModel, MachineModel, NodeModel } from '@console/internal/models';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import ActivityBody, {
  RecentEventsBody,
  Activity,
} from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import ActivityItem from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { EventKind, K8sResourceKind, MachineKind } from '@console/internal/module/k8s';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { getName, getNamespace, getMachineNodeName } from '@console/shared';
import { BareMetalHostModel } from '../../../models';
import { BareMetalHostKind } from '../../../types';
import { isHostInProgressState, getBareMetalHostStatus } from '../../../status/host-status';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';

const eventsResource: FirehoseResource = { isList: true, kind: EventModel.kind, prop: 'events' };

const matchesInvolvedObject = (
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
  matchesInvolvedObject(BareMetalHostModel.kind, getName(host), getNamespace(host), event) ||
  matchesInvolvedObject(MachineModel.kind, getName(machine), getNamespace(machine), event) ||
  matchesInvolvedObject(NodeModel.kind, getMachineNodeName(machine), null, event);

const getHostEventsFilter = (
  host: K8sResourceKind,
  machine: MachineKind,
): ((event: EventKind) => boolean) => _.partial(hostEventsFilter, host, machine);

const EventsCard: React.FC<EventsCardProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  const { obj, machine } = React.useContext(BareMetalHostDashboardContext);
  React.useEffect(() => {
    watchK8sResource(eventsResource);
    return () => {
      stopWatchK8sResource(eventsResource);
    };
  }, [watchK8sResource, stopWatchK8sResource]);

  const filter = getHostEventsFilter(obj, machine);

  const inProgress = isHostInProgressState(obj);
  const hostStatus = getBareMetalHostStatus(obj);

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>Activity</DashboardCardTitle>
        <DashboardCardLink
          to={`${resourcePathFromModel(
            BareMetalHostModel,
            getName(obj),
            getNamespace(obj),
          )}/events`}
        >
          View events
        </DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ActivityBody>
          <div className="co-activity-card__ongoing-title">Ongoing</div>
          <div className="co-activity-card__ongoing-body">
            {inProgress ? (
              <Activity timestamp={null}>
                <ActivityItem>
                  {hostStatus.title}
                  <ResourceLink
                    kind={BareMetalHostModel.kind}
                    name={getName(obj)}
                    namespace={getNamespace(obj)}
                  />
                </ActivityItem>
              </Activity>
            ) : (
              <Activity>
                <div className="text-secondary">There are no ongoing activities.</div>
              </Activity>
            )}
          </div>
          <RecentEventsBody
            events={resources.events as FirehoseResult<EventKind[]>}
            filter={filter}
          />
        </ActivityBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(EventsCard);

type EventsCardProps = DashboardItemProps & {
  obj: BareMetalHostKind;
};

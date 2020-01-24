import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink, {
  DashboardCardButtonLink,
} from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import ActivityBody, {
  RecentEventsBodyContent,
} from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import { getName, getNamespace } from '@console/shared';
import { resourcePath, FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { EventModel } from '@console/internal/models';
import { EventKind } from '@console/internal/module/k8s';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { VirtualMachineModel } from '../../../models';
import { getVmEventsFilters } from '../../../selectors/event';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import { VMILikeEntityKind } from '../../../types/vmLike';

const combinedVmFilter = (vm: VMILikeEntityKind): EventFilterFuncion => (event) =>
  getVmEventsFilters(vm).some((filter) => filter(event.involvedObject));

const getEventsResource = (namespace: string): FirehoseResource => ({
  isList: true,
  kind: EventModel.kind,
  prop: 'events',
  namespace,
});

const RecentEvent = withDashboardResources<RecentEventProps>(
  ({ watchK8sResource, stopWatchK8sResource, resources, vm, paused, setPaused }) => {
    React.useEffect(() => {
      if (vm) {
        const eventsResource = getEventsResource(getNamespace(vm));
        watchK8sResource(eventsResource);
        return () => {
          stopWatchK8sResource(eventsResource);
        };
      }
      return null;
    }, [watchK8sResource, stopWatchK8sResource, vm]);
    return (
      <RecentEventsBodyContent
        events={resources.events as FirehoseResult<EventKind[]>}
        filter={combinedVmFilter(vm)}
        paused={paused}
        setPaused={setPaused}
      />
    );
  },
);

export const VMActivityCard: React.FC = () => {
  const { vm, vmi } = React.useContext(VMDashboardContext);
  const vmiLike = vm || vmi;

  const [paused, setPaused] = React.useState(false);
  const togglePause = React.useCallback(() => setPaused(!paused), [paused]);

  const name = getName(vmiLike);
  const namespace = getNamespace(vmiLike);
  const viewEventsLink = `${resourcePath(VirtualMachineModel.kind, name, namespace)}/events`;

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>Events</DashboardCardTitle>
        <DashboardCardLink to={viewEventsLink}>View all</DashboardCardLink>
        <DashboardCardButtonLink onClick={togglePause}>
          {paused ? 'Unpause' : 'Pause'}
        </DashboardCardButtonLink>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ActivityBody>
          <RecentEvent vm={vmiLike} paused={paused} setPaused={setPaused} />
        </ActivityBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

type EventFilterFuncion = (event: EventKind) => boolean;

type RecentEventProps = DashboardItemProps & {
  vm: VMILikeEntityKind;
  paused: boolean;
  setPaused: (paused: boolean) => void;
};

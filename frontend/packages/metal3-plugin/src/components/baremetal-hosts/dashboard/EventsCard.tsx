import type { FC } from 'react';
import { useContext } from 'react';
import { Card, CardHeader, CardTitle } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ResourceLink, resourcePathFromModel } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { EventModel, MachineModel, NodeModel } from '@console/internal/models';
import type { EventKind, K8sResourceKind, MachineKind } from '@console/internal/module/k8s';
import ActivityBody, {
  RecentEventsBody,
  Activity,
} from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import ActivityItem from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import { getMachineNodeName } from '@console/shared/src/selectors/machine';
import { BareMetalHostModel } from '../../../models';
import { isHostInProgressState, getBareMetalHostStatus } from '../../../status/host-status';
import type { BareMetalHostKind } from '../../../types/host';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';

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

const EventsCard: FC = () => {
  const { t } = useTranslation('metal3-plugin');
  const { obj, machine } = useContext(BareMetalHostDashboardContext);

  const [eventsData, eventsLoaded, eventsLoadError] = useK8sWatchResource<EventKind[]>({
    isList: true,
    kind: EventModel.kind,
  });

  const filter = getHostEventsFilter(obj, machine);

  const inProgress = isHostInProgressState(obj);
  const hostStatus = getBareMetalHostStatus(obj);

  return (
    <Card>
      <CardHeader
        actions={{
          actions: (
            <>
              <Link
                to={`${resourcePathFromModel(
                  BareMetalHostModel,
                  getName(obj),
                  getNamespace(obj),
                )}/events`}
              >
                {t('View events')}
              </Link>
            </>
          ),
          hasNoOffset: false,
          className: 'co-overview-card__actions',
        }}
      >
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <ActivityBody>
        <div className="co-activity-card__ongoing-title">Ongoing</div>
        <div className="co-activity-card__ongoing-body">
          {inProgress ? (
            <Activity timestamp={null}>
              <ActivityItem>
                {t(hostStatus.titleKey)}
                <ResourceLink
                  kind={BareMetalHostModel.kind}
                  name={getName(obj)}
                  namespace={getNamespace(obj)}
                />
              </ActivityItem>
            </Activity>
          ) : (
            <Activity>
              <div className="pf-v6-u-text-color-subtle">
                {t('There are no ongoing activities.')}
              </div>
            </Activity>
          )}
        </div>
        <RecentEventsBody
          eventsData={eventsData}
          eventsLoaded={eventsLoaded}
          eventsLoadError={eventsLoadError}
          filter={filter}
        />
      </ActivityBody>
    </Card>
  );
};

export default EventsCard;

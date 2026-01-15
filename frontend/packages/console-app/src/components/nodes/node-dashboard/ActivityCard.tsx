import type { FC } from 'react';
import { useCallback, useContext } from 'react';
import { Card, CardHeader, CardTitle } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { EventModel, NodeModel } from '@console/internal/models';
import { EventKind, NodeKind } from '@console/internal/module/k8s';
import ActivityBody, {
  RecentEventsBody,
  OngoingActivityBody,
} from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import { NodeDashboardContext } from './NodeDashboardContext';

const eventsResource = {
  isList: true,
  kind: EventModel.kind,
};

const nodeEventsFilter = (event: EventKind, uid: string, kind: string, name: string): boolean => {
  const { uid: objectUID, kind: objectKind, name: objectName } = event?.involvedObject || {};
  return objectUID === uid && objectKind === kind && objectName === name;
};

const RecentEvent: FC<RecentEventProps> = ({ node }) => {
  const [eventsData, eventsLoaded, eventsLoadError] = useK8sWatchResource<EventKind[]>(
    eventsResource,
  );
  const { uid, name } = node.metadata;
  const eventsFilter = useCallback((event) => nodeEventsFilter(event, uid, NodeModel.kind, name), [
    uid,
    name,
  ]);
  return (
    <RecentEventsBody
      eventsData={eventsData}
      eventsLoaded={eventsLoaded}
      eventsLoadError={eventsLoadError}
      filter={eventsFilter}
    />
  );
};

const ActivityCard: FC = () => {
  const { obj } = useContext(NodeDashboardContext);
  const eventsLink = `${resourcePathFromModel(NodeModel, obj.metadata.name)}/events`;
  const { t } = useTranslation();
  return (
    <Card data-test-id="activity-card">
      <CardHeader
        actions={{
          actions: (
            <>
              <Link to={eventsLink}>{t('console-app~View events')}</Link>
            </>
          ),
          hasNoOffset: false,
          className: 'co-overview-card__actions',
        }}
      >
        <CardTitle>{t('console-app~Activity')}</CardTitle>
      </CardHeader>
      <ActivityBody className="co-project-dashboard__activity-body">
        <OngoingActivityBody loaded />
        <RecentEvent node={obj} />
      </ActivityBody>
    </Card>
  );
};

type RecentEventProps = {
  node: NodeKind;
};

export default ActivityCard;

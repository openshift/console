import * as React from 'react';
import { Card, CardHeader, CardTitle, CardActions } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { EventModel, NodeModel } from '@console/internal/models';
import { EventKind, NodeKind } from '@console/internal/module/k8s';
import ActivityBody, {
  RecentEventsBody,
  OngoingActivityBody,
} from '@console/shared/src/components/dashboard/activity-card/ActivityBody';
import { useActiveCluster } from '@console/shared/src/hooks/useActiveCluster';
import { NodeDashboardContext } from './NodeDashboardContext';

const eventsResource = {
  isList: true,
  kind: EventModel.kind,
};

const nodeEventsFilter = (event: EventKind, uid: string, kind: string, name: string): boolean => {
  const { uid: objectUID, kind: objectKind, name: objectName } = event?.involvedObject || {};
  return objectUID === uid && objectKind === kind && objectName === name;
};

const RecentEvent: React.FC<RecentEventProps> = ({ node }) => {
  const [data, loaded, loadError] = useK8sWatchResource<EventKind[]>(eventsResource);
  const { uid, name } = node.metadata;
  const eventsFilter = React.useCallback(
    (event) => nodeEventsFilter(event, uid, NodeModel.kind, name),
    [uid, name],
  );
  return <RecentEventsBody events={{ data, loaded, loadError }} filter={eventsFilter} />;
};

const ActivityCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const [cluster] = useActiveCluster();
  const eventsLink = `${resourcePathFromModel(
    NodeModel,
    obj.metadata.name,
    undefined,
    cluster,
  )}/events`;
  const { t } = useTranslation();
  return (
    <Card data-test-id="activity-card" className="co-overview-card--gradient">
      <CardHeader>
        <CardTitle>{t('console-app~Activity')}</CardTitle>
        <CardActions className="co-overview-card__actions">
          <Link to={eventsLink}>{t('console-app~View events')}</Link>
        </CardActions>
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

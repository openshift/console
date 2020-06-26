import * as React from 'react';
import { OverviewItem } from '@console/shared';
import OperatorBackedOwnerReferences from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { RevisionModel, ServiceModel, EventingSubscriptionModel } from '../../models';
import KnativeServiceResources from './KnativeServiceResources';
import KnativeRevisionResources from './KnativeRevisionResources';
import RevisionsOverviewList from './RevisionsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';
import ConfigurationsOverviewList from './ConfigurationsOverviewList';
import EventSinkServicesOverviewList from './EventSinkServicesOverviewList';
import {
  isDynamicEventResourceKind,
  isEventingChannelResourceKind,
} from '../../utils/fetch-dynamic-eventsources-utils';
import EventPubSubResources from './EventPubSubResources';

type OverviewDetailsResourcesTabProps = {
  item: OverviewItem;
};

const getSidebarResources = (item: OverviewItem) => {
  const { obj, ksroutes, revisions, configurations, pods, current } = item;
  if (isDynamicEventResourceKind(referenceFor(obj))) {
    return <EventSinkServicesOverviewList obj={obj} pods={pods} current={current} />;
  }
  if (isEventingChannelResourceKind(referenceFor(obj))) {
    return <EventPubSubResources item={item} />;
  }
  switch (obj.kind) {
    case RevisionModel.kind:
      return (
        <KnativeRevisionResources
          ksroutes={ksroutes}
          obj={obj}
          configurations={configurations}
          pods={pods}
          current={current}
        />
      );
    case ServiceModel.kind:
      return <KnativeServiceResources item={item} />;
    case EventingSubscriptionModel.kind:
      return <EventPubSubResources item={item} />;
    default:
      return (
        <>
          <RevisionsOverviewList revisions={revisions} service={obj} />
          <KSRoutesOverviewList ksroutes={ksroutes} resource={obj} />
          <ConfigurationsOverviewList configurations={configurations} />
        </>
      );
  }
};
const OverviewDetailsKnativeResourcesTab: React.FC<OverviewDetailsResourcesTabProps> = ({
  item,
}) => (
  <div className="overview__sidebar-pane-body">
    <OperatorBackedOwnerReferences item={item} />
    {getSidebarResources(item)}
  </div>
);

export default OverviewDetailsKnativeResourcesTab;

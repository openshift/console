import * as React from 'react';
import OperatorBackedOwnerReferences from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import {
  RevisionModel,
  ServiceModel,
  EventingSubscriptionModel,
  EventingTriggerModel,
  EventingBrokerModel,
  CamelKameletBindingModel,
} from '../../models';
import KnativeServiceResources from './KnativeServiceResources';
import KnativeRevisionResources from './KnativeRevisionResources';
import RevisionsOverviewList from './RevisionsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';
import ConfigurationsOverviewList from './ConfigurationsOverviewList';
import EventSourceResources from './EventSourceResources';
import {
  isDynamicEventResourceKind,
  isEventingChannelResourceKind,
} from '../../utils/fetch-dynamic-eventsources-utils';
import EventPubSubResources from './EventPubSubResources';
import { KnativeServiceOverviewItem } from '../../topology/topology-types';

type OverviewDetailsResourcesTabProps = {
  item: KnativeServiceOverviewItem;
};

const getSidebarResources = (item: KnativeServiceOverviewItem) => {
  const { obj, ksroutes, revisions, configurations, eventSources } = item;
  if (isDynamicEventResourceKind(referenceFor(obj))) {
    return <EventSourceResources obj={obj} ownedSources={eventSources} />;
  }
  if (isEventingChannelResourceKind(referenceFor(obj))) {
    return <EventPubSubResources item={item} />;
  }
  switch (obj.kind) {
    case RevisionModel.kind:
      return (
        <KnativeRevisionResources ksroutes={ksroutes} obj={obj} configurations={configurations} />
      );
    case ServiceModel.kind:
      return <KnativeServiceResources item={item} />;
    case CamelKameletBindingModel.kind:
      return <EventSourceResources obj={obj} ownedSources={eventSources} />;
    case EventingBrokerModel.kind:
    case EventingTriggerModel.kind:
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

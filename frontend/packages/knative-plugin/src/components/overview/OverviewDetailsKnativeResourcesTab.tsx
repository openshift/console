import * as React from 'react';
import OperatorBackedOwnerReferences from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { RevisionModel, ServiceModel, CamelKameletBindingModel } from '../../models';
import { KnativeServiceOverviewItem } from '../../topology/topology-types';
import { isDynamicEventResourceKind } from '../../utils/fetch-dynamic-eventsources-utils';
import ConfigurationsOverviewList from './ConfigurationsOverviewList';
import EventSourceResources from './EventSourceResources';
import KnativeRevisionResources from './KnativeRevisionResources';
import KnativeServiceResources from './KnativeServiceResources';
import RevisionsOverviewList from './RevisionsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';

type OverviewDetailsResourcesTabProps = {
  item: KnativeServiceOverviewItem;
};

const getSidebarResources = (item: KnativeServiceOverviewItem) => {
  const { obj, ksroutes, revisions, configurations, eventSources } = item;
  if (isDynamicEventResourceKind(referenceFor(obj))) {
    return <EventSourceResources obj={obj} ownedSources={eventSources} />;
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

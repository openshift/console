import * as React from 'react';
import { OverviewItem } from '@console/shared';
import OperatorBackedOwnerReferences from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { RevisionModel, ServiceModel } from '../../models';
import KnativeServiceResources from './KnativeServiceResources';
import KnativeRevisionResources from './KnativeRevisionResources';
import RevisionsOverviewList from './RevisionsOverviewList';
import KSRoutesOverviewList from './RoutesOverviewList';
import ConfigurationsOverviewList from './ConfigurationsOverviewList';
import EventSinkServicesOverviewList from './EventSinkServicesOverviewList';
import { isDynamicEventResourceKind } from '../../utils/fetch-dynamic-eventsources-utils';

type OverviewDetailsResourcesTabProps = {
  item: OverviewItem;
};

const getSidebarResources = ({
  obj,
  ksroutes,
  revisions,
  configurations,
  pods,
  current,
}: OverviewItem) => {
  if (isDynamicEventResourceKind(referenceFor(obj))) {
    return <EventSinkServicesOverviewList obj={obj} pods={pods} current={current} />;
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
      return (
        <KnativeServiceResources ksroutes={ksroutes} obj={obj} revisions={revisions} pods={pods} />
      );
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

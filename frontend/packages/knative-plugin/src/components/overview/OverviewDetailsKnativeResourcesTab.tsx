import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { OverviewItem } from '@console/shared';
import OperatorBackedOwnerReferences from '@console/internal/components/utils';
import {
  RevisionModel,
  ServiceModel,
  EventSourceCronJobModel,
  EventSourceContainerModel,
  EventSourceApiServerModel,
  EventSourceCamelModel,
  EventSourceKafkaModel,
} from '../../models';
import KnativeServiceResources from './KnativeServiceResources';
import KnativeRevisionResources from './KnativeRevisionResources';
import EventSinkServicesOverviewList from './EventSinkServicesOverviewList';

export type KnativeOverviewProps = {
  ksroutes: K8sResourceKind[];
  configurations: K8sResourceKind[];
  revisions: K8sResourceKind[];
  obj: K8sResourceKind;
};

export type OverviewDetailsResourcesTabProps = {
  item: OverviewItem;
};

const getSidebarResources = ({ obj, ksroutes, revisions, configurations }: OverviewItem) => {
  switch (obj.kind) {
    case RevisionModel.kind:
      return (
        <KnativeRevisionResources ksroutes={ksroutes} obj={obj} configurations={configurations} />
      );
    case ServiceModel.kind:
      return <KnativeServiceResources ksroutes={ksroutes} obj={obj} revisions={revisions} />;
    case EventSourceCronJobModel.kind:
    case EventSourceContainerModel.kind:
    case EventSourceApiServerModel.kind:
    case EventSourceCamelModel.kind:
    case EventSourceKafkaModel.kind:
      return <EventSinkServicesOverviewList obj={obj} />;
    default:
      return null;
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

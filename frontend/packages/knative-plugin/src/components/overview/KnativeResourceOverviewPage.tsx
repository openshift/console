import * as React from 'react';
import { ResourceSummary, Kebab, LoadingBox } from '@console/internal/components/utils';
import { ResourceOverviewDetails } from '@console/internal/components/overview/resource-overview-details';
import { OverviewItem, PodRing } from '@console/shared';
import { K8sKind } from '@console/internal/module/k8s';
import { getKsResourceModel } from '../../utils/get-knative-resources';
import { RevisionModel } from '../../models';
import OverviewDetailsKnativeResourcesTab from './OverviewDetailsKnativeResourcesTab';

export type KnativeResourceOverviewPageProps = {
  item?: OverviewItem;
  knativeModels?: K8sKind[];
  kindsInFlight?: boolean;
};

const KnativeOverview: React.FC<KnativeResourceOverviewPageProps> = ({ item }) => {
  const { obj, current } = item;
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {obj.kind === RevisionModel.kind && (
        <div className="resource-overview__pod-counts">
          <PodRing
            pods={current ? current.pods : []}
            obj={obj}
            rc={current && current.obj}
            resourceKind={RevisionModel}
            path="/spec/replicas"
          />
        </div>
      )}
      <div className="resource-overview__summary">
        <ResourceSummary resource={item.obj} />
      </div>
    </div>
  );
};
const tabs = [
  {
    name: 'Overview',
    component: KnativeOverview,
  },
  {
    name: 'Resources',
    component: OverviewDetailsKnativeResourcesTab,
  },
];

export const KnativeOverviewPage: React.ComponentType<
  KnativeResourceOverviewPageProps
> = getKsResourceModel(
  ({ item, knativeModels, kindsInFlight }: KnativeResourceOverviewPageProps) => {
    if (kindsInFlight) {
      return !knativeModels ? null : <LoadingBox />;
    }
    const resourceModel = knativeModels.find((model) => model.kind === item.obj.kind);
    return (
      <ResourceOverviewDetails
        item={item}
        kindObj={resourceModel}
        menuActions={[...Kebab.getExtensionsActionsForKind(resourceModel), ...Kebab.factory.common]}
        tabs={tabs}
      />
    );
  },
);

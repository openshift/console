import * as React from 'react';
import { Kebab, LoadingBox } from '@console/internal/components/utils';
import { ResourceOverviewDetails } from '@console/internal/components/overview/resource-overview-details';
import { OverviewItem } from '@console/shared';
import { groupVersionFor, K8sKind } from '@console/internal/module/k8s';
import { getKsResourceModel } from '../../utils/get-knative-resources';
import { KnativeOverview } from './KnativeOverview';
import OverviewDetailsKnativeResourcesTab from './OverviewDetailsKnativeResourcesTab';

export type KnativeResourceOverviewPageProps = {
  item?: OverviewItem;
  knativeModels?: K8sKind[];
  kindsInFlight?: boolean;
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

export const KnativeResourceOverviewPage: React.ComponentType<KnativeResourceOverviewPageProps> = ({
  item,
  knativeModels,
  kindsInFlight,
}: KnativeResourceOverviewPageProps) => {
  if (kindsInFlight) {
    return !knativeModels ? null : <LoadingBox />;
  }
  const apiInfo = groupVersionFor(item.obj.apiVersion);
  const resourceModel = knativeModels.find(
    (model) =>
      model.kind === item.obj.kind &&
      model.apiGroup === apiInfo.group &&
      model.apiVersion === apiInfo.version,
  );
  return (
    <ResourceOverviewDetails
      item={item}
      kindObj={resourceModel}
      menuActions={[...Kebab.getExtensionsActionsForKind(resourceModel), ...Kebab.factory.common]}
      tabs={tabs}
    />
  );
};

export default getKsResourceModel(KnativeResourceOverviewPage);

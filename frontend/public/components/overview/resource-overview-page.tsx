import * as React from 'react';

import { connectToModel } from '../../kinds';
import { referenceForModel } from '../../module/k8s';
import { AsyncComponent, Kebab, ResourceOverviewHeading, ResourceSummary } from '../utils';

import { BuildOverview } from './build-overview';
import { HPAOverview } from './hpa-overview';
import { NetworkingOverview } from './networking-overview';
import { PodsOverview } from './pods-overview';
import { resourceOverviewPages } from './resource-overview-pages';
import { OverviewItem, usePluginsOverviewTabSection } from '@console/shared';
import { ManagedByOperatorLink } from '../utils/managed-by';

const { common } = Kebab.factory;

export const OverviewDetailsResourcesTab: React.SFC<OverviewDetailsResourcesTabProps> = ({
  item,
}) => {
  const { buildConfigs, hpas, routes, services, obj } = item;
  const hasBuildConfig = buildConfigs?.length > 0;
  const pluginComponents = usePluginsOverviewTabSection(item);
  return (
    <div className="overview__sidebar-pane-body">
      <ManagedByOperatorLink obj={item.obj} />
      <PodsOverview obj={obj} hasBuildConfig={hasBuildConfig} />
      <BuildOverview buildConfigs={buildConfigs} />
      <HPAOverview hpas={hpas} />
      {pluginComponents.map(({ Component, key }) => (
        <Component key={key} item={item} />
      ))}
      <NetworkingOverview services={services} routes={routes} />
    </div>
  );
};

export const DefaultOverviewPage = connectToModel(
  ({ kindObj: kindObject, item, customActions }) => (
    <div className="overview__sidebar-pane resource-overview">
      <ResourceOverviewHeading
        actions={[
          ...(customActions ? customActions : []),
          ...Kebab.getExtensionsActionsForKind(kindObject),
          ...common,
        ]}
        kindObj={kindObject}
        resources={item}
      />
      <div className="overview__sidebar-pane-body resource-overview__body">
        <div className="resource-overview__summary">
          <ResourceSummary resource={item.obj} />
        </div>
      </div>
    </div>
  ),
);

export const ResourceOverviewPage = connectToModel(({ kindObj, item, customActions }) => {
  const ref = referenceForModel(kindObj);
  const loader = resourceOverviewPages.get(ref, () => Promise.resolve(DefaultOverviewPage));
  return (
    <AsyncComponent loader={loader} kindObj={kindObj} item={item} customActions={customActions} />
  );
});

export type OverviewDetailsResourcesTabProps = {
  item: OverviewItem;
};

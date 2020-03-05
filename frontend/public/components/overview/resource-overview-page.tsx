import * as React from 'react';

import { connectToModel } from '../../kinds';
import { referenceForModel } from '../../module/k8s';
import OperatorBackedOwnerReferences, {
  AsyncComponent,
  Kebab,
  ResourceOverviewHeading,
  ResourceSummary,
} from '../utils';

import { BuildOverview } from './build-overview';
import { NetworkingOverview } from './networking-overview';
import { PodsOverview } from './pods-overview';
import { resourceOverviewPages } from './resource-overview-pages';
import { OverviewItem } from '@console/shared';
import * as plugins from '../../plugins';

const getResourceTabSectionComp = (t) => (props) => (
  <AsyncComponent {...props} loader={t.properties.loader} />
);

const getPluginTabSectionResource = (item) => {
  return plugins.registry
    .getOverviewTabSections()
    .filter((section) => item[section.properties.key])
    .map((section) => ({
      Component: getResourceTabSectionComp(section),
      key: section.properties.key,
    }));
};

export const OverviewDetailsResourcesTab: React.SFC<OverviewDetailsResourcesTabProps> = ({
  item,
}) => {
  const { buildConfigs, routes, services, pods, obj } = item;
  const pluginComponents = getPluginTabSectionResource(item);
  return (
    <div className="overview__sidebar-pane-body">
      <OperatorBackedOwnerReferences item={item} />
      <PodsOverview pods={pods} obj={obj} />
      <BuildOverview buildConfigs={buildConfigs} />
      {pluginComponents.map(({ Component, key }) => (
        <Component key={key} item={item} />
      ))}
      <NetworkingOverview services={services} routes={routes} />
    </div>
  );
};

export const DefaultOverviewPage = connectToModel(({ kindObj: kindObject, item }) => (
  <div className="overview__sidebar-pane resource-overview">
    <ResourceOverviewHeading
      actions={[...Kebab.factory.common]}
      kindObj={kindObject}
      resource={item.obj}
    />
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__summary">
        <ResourceSummary resource={item.obj} />
      </div>
    </div>
  </div>
));

export const ResourceOverviewPage = connectToModel(({ kindObj, item }) => {
  const ref = referenceForModel(kindObj);
  const loader = resourceOverviewPages.get(ref, () => Promise.resolve(DefaultOverviewPage));
  return <AsyncComponent loader={loader} kindObj={kindObj} item={item} />;
});

export type OverviewDetailsResourcesTabProps = {
  item: OverviewItem;
};

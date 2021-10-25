/**
 * @deprecated [TopologySideBar] delete this file once all the side panels uses dynamic extensions.
 */

import * as React from 'react';
import {
  OverviewItem,
  usePluginsOverviewTabSection,
  useBuildConfigsWatcher,
} from '@console/shared';
import { K8sModel } from '@console/dynamic-plugin-sdk';
import { connectToModel } from '../../kinds';
import { modelFor, referenceFor, referenceForModel } from '../../module/k8s';
import { AsyncComponent, Kebab, KebabAction, ResourceSummary } from '../utils';
import { BuildOverview } from './build-overview';
import { HPAOverview } from './hpa-overview';
import { NetworkingOverview } from './networking-overview';
import { PodsOverview } from './pods-overview';
import { resourceOverviewPages } from './resource-overview-pages';
import { ManagedByOperatorLink } from '../utils/managed-by';
import { useTranslation } from 'react-i18next';
import { ResourceOverviewDetails } from './resource-overview-details';

const { common } = Kebab.factory;

export const OverviewDetailsResourcesTab: React.SFC<OverviewDetailsResourcesTabProps> = ({
  item,
}) => {
  const { hpas, obj } = item;
  const pluginComponents = usePluginsOverviewTabSection(item);
  const { loaded, loadError, buildConfigs } = useBuildConfigsWatcher(obj);

  return (
    <div className="overview__sidebar-pane-body">
      <ManagedByOperatorLink obj={item.obj} />
      <PodsOverview obj={obj} buildConfigData={{ loaded, loadError, buildConfigs }} />
      <BuildOverview buildConfigs={buildConfigs} />
      <HPAOverview hpas={hpas} />
      {pluginComponents.map(({ Component, key }) => (
        <Component key={key} item={item} />
      ))}
      <NetworkingOverview obj={obj} />
    </div>
  );
};

export const DefaultOverviewPage: React.FC<{ item: OverviewItem }> = ({ item }) => {
  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-body resource-overview__body">
        <div className="resource-overview__summary">
          <ResourceSummary resource={item.obj} />
        </div>
      </div>
    </div>
  );
};

const DefaultSideBar: React.FC<{
  kindObj: K8sModel;
  item: OverviewItem;
  customActions?: KebabAction[];
}> = ({ kindObj, item, customActions }) => {
  const { t } = useTranslation();

  const tabs = [
    {
      name: t('public~Details'),
      component: DefaultOverviewPage,
    },
  ];
  const menuActions = [
    ...(customActions ? customActions : []),
    ...Kebab.getExtensionsActionsForKind(kindObj),
    ...common,
  ];
  return (
    <ResourceOverviewDetails item={item} kindObj={kindObj} menuActions={menuActions} tabs={tabs} />
  );
};

export const ResourceOverviewPage = connectToModel(({ kindObj, item, customActions }) => {
  if (!kindObj && !item?.obj) {
    return null;
  }
  const resourceModel = kindObj || modelFor(referenceFor(item.obj));
  const ref = referenceForModel(resourceModel);
  const loader = resourceOverviewPages.get(ref, () => Promise.resolve(DefaultSideBar));
  return (
    <AsyncComponent
      loader={loader}
      kindObj={resourceModel}
      item={item}
      customActions={customActions}
    />
  );
});

export type OverviewDetailsResourcesTabProps = {
  item: OverviewItem;
};

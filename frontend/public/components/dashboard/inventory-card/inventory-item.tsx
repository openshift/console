import * as React from 'react';
import { Icon } from 'patternfly-react';
import { Link } from 'react-router-dom';

import * as plugins from '../../../plugins';
import { LoadingInline } from '../../utils';
import { K8sResourceKind, K8sKind } from '../../../module/k8s';
import { InventoryStatusGroup } from './status-group';

const getPluginStatusGroupIcons = () => {
  const pluginGroups = {};
  plugins.registry.getDashboardsInventoryItemGroups().forEach(group => {
    pluginGroups[group.properties.id] = group.properties.icon;
  });
  return pluginGroups;
};

const statusGroupIcons = {
  [InventoryStatusGroup.OK]: (
    <Icon
      type="pf"
      name="icon-ok"
      className="co-inventory-card__status-icon co-inventory-card__status-icon--ok"
    />
  ),
  [InventoryStatusGroup.WARN]: (
    <Icon
      type="pf"
      name="icon-warning-triangle-o"
      className="co-inventory-card__status-icon co-inventory-card__status-icon--warn"
    />
  ),
  [InventoryStatusGroup.ERROR]: (
    <Icon
      type="pf"
      name="icon-error-circle-o"
      className="co-inventory-card__status-icon co-inventory-card__status-icon--error"
    />
  ),
  [InventoryStatusGroup.PROGRESS]: (
    <Icon
      type="pf"
      name="in-progress"
      className="co-inventory-card__status-icon co-inventory-card__status-icon--progress"
    />
  ),
  [InventoryStatusGroup.NOT_MAPPED]: (
    <Icon
      type="pf"
      name="icon-help"
      className="co-inventory-card__status-icon co-inventory-card__status-icon--question"
    />
  ),
  ...getPluginStatusGroupIcons(),
};

const Status: React.FC<StatusProps> = React.memo(({ groupID, count, statusIDs, kind, namespace, filterType}) => {
  const statusItems = encodeURIComponent(statusIDs.join(','));
  const namespacePath = namespace ? `ns/${namespace}` : 'all-namespaces';
  const to = filterType && statusItems.length > 0 ? `/k8s/${namespacePath}/${kind.plural}?rowFilter-${filterType}=${statusItems}` : `/k8s/${namespacePath}/${kind.plural}`;
  const groupIcon = statusGroupIcons[groupID] || statusGroupIcons[InventoryStatusGroup.NOT_MAPPED];
  return (
    <div className="co-inventory-card__status">
      <Link to={to} style={{textDecoration: 'none'}}>
        {groupIcon}
        <span className="co-inventory-card__status-text">{count}</span>
      </Link>
    </div>
  );
});

export const InventoryItem: React.FC<InventoryItemProps> = React.memo(({ kind, useAbbr, resources, additionalResources, isLoading, mapper, namespace }) => {
  const groups = mapper(resources, additionalResources);
  let title: string;
  if (useAbbr) {
    title = resources.length !== 1 ? `${kind.abbr}s` : kind.abbr;
  } else {
    title = resources.length !== 1 ? kind.labelPlural : kind.label;
  }
  return (
    <div className="co-inventory-card__item">
      <div className="co-inventory-card__item-title">{isLoading ? title : `${resources.length} ${title}`}</div>
      {isLoading ? <LoadingInline /> : (
        <div className="co-inventory-card__item-status">
          {Object.keys(groups).filter(key => groups[key].count > 0).map((key, index) => (
            <Status
              key={index}
              kind={kind}
              namespace={namespace}
              groupID={key}
              count={groups[key].count}
              statusIDs={groups[key].statusIDs}
              filterType={groups[key].filterType}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export type StatusGroupMapper = (resources: K8sResourceKind[], additionalResources?: {[key: string]: K8sResourceKind[]}) => {[key in InventoryStatusGroup | string]: {filterType?: string, statusIDs: string[], count: number}};

type StatusProps = {
  groupID: InventoryStatusGroup | string;
  count: number;
  statusIDs: string[];
  kind: K8sKind;
  namespace?: string;
  filterType?: string;
}

type InventoryItemProps = {
  resources: K8sResourceKind[];
  additionalResources?: {[key: string]: K8sResourceKind[]};
  mapper: StatusGroupMapper;
  kind: K8sKind;
  useAbbr?: boolean;
  isLoading: boolean;
  namespace?: string;
}

import * as React from 'react';
import { Link } from 'react-router-dom';

import * as plugins from '../../../plugins';
import { LoadingInline, StatusIcon } from '../../utils';
import { K8sResourceKind, K8sKind } from '../../../module/k8s';
import { InventoryStatusGroup } from './status-group';

const defaultStatusGroupIcons = {
  [InventoryStatusGroup.OK]: (
    <StatusIcon
      status="Ready"
      additionalIconClassName="co-inventory-card__status-icon co-inventory-card__status-icon--ok"
    />
  ),
  [InventoryStatusGroup.WARN]: (
    <StatusIcon
      status="Warning"
      additionalIconClassName="co-inventory-card__status-icon co-inventory-card__status-icon--warn"
    />
  ),
  [InventoryStatusGroup.ERROR]: (
    <StatusIcon
      status="Error"
      additionalIconClassName="co-inventory-card__status-icon co-inventory-card__status-icon--error"
    />
  ),
  [InventoryStatusGroup.PROGRESS]: (
    <StatusIcon
      status="In Progress"
      additionalIconClassName="co-inventory-card__status-icon co-inventory-card__status-icon--progress"
    />
  ),
  [InventoryStatusGroup.NOT_MAPPED]: (
    <StatusIcon
      status="Unknown"
      additionalIconClassName="co-inventory-card__status-icon co-inventory-card__status-icon--question"
    />
  ),
};

const getStatusGroupIcons = () => {
  const groupStatusIcons = {...defaultStatusGroupIcons};
  plugins.registry.getDashboardsInventoryItemGroups().forEach(group => {
    if (!groupStatusIcons[group.properties.id]) {
      groupStatusIcons[group.properties.id] = group.properties.icon;
    }
  });
  return groupStatusIcons;
};

export const InventoryItem: React.FC<InventoryItemProps> = ({ isLoading, singularTitle, pluralTitle, count, children }) => {
  const title = count !== 1 ? pluralTitle : singularTitle;
  return (
    <div className="co-inventory-card__item">
      <div className="co-inventory-card__item-title">{isLoading ? title : `${count} ${title}`}</div>
      {isLoading ? <LoadingInline /> : (
        <div className="co-inventory-card__item-status">
          {children}
        </div>
      )}
    </div>
  );
};

const Status: React.FC<StatusProps> = React.memo(({ groupID, count, statusIDs, kind, namespace, filterType}) => {
  const statusItems = encodeURIComponent(statusIDs.join(','));
  const namespacePath = namespace ? `ns/${namespace}` : 'all-namespaces';
  const to = filterType && statusItems.length > 0 ? `/k8s/${namespacePath}/${kind.plural}?rowFilter-${filterType}=${statusItems}` : `/k8s/${namespacePath}/${kind.plural}`;
  const statusGroupIcons = getStatusGroupIcons();
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

export const ResourceInventoryItem: React.FC<ResourceInventoryItemProps> = React.memo(({ kind, useAbbr, resources, additionalResources, isLoading, mapper, namespace }) => {
  const groups = mapper(resources, additionalResources);
  const [singularTitle, pluralTitle] = useAbbr ? [kind.abbr, `${kind.abbr}s`] : [kind.label, kind.labelPlural];
  return (
    <InventoryItem
      isLoading={isLoading}
      singularTitle={singularTitle}
      pluralTitle={pluralTitle}
      count={resources.length}
    >
      {Object.keys(groups).filter(key => groups[key].count > 0).map(key => (
        <Status
          key={key}
          kind={kind}
          namespace={namespace}
          groupID={key}
          count={groups[key].count}
          statusIDs={groups[key].statusIDs}
          filterType={groups[key].filterType}
        />
      ))}
    </InventoryItem>
  );
});

export type StatusGroupMapper = (resources: K8sResourceKind[], additionalResources?: {[key: string]: K8sResourceKind[]}) => {[key in InventoryStatusGroup | string]: {filterType?: string, statusIDs: string[], count: number}};

type InventoryItemProps = {
  isLoading: boolean,
  singularTitle: string,
  pluralTitle: string,
  count: number,
  children?: React.ReactChild[],
};

type StatusProps = {
  groupID: InventoryStatusGroup | string;
  count: number;
  statusIDs: string[];
  kind: K8sKind;
  namespace?: string;
  filterType?: string;
}

type ResourceInventoryItemProps = {
  resources: K8sResourceKind[];
  additionalResources?: {[key: string]: K8sResourceKind[]};
  mapper: StatusGroupMapper;
  kind: K8sKind;
  useAbbr?: boolean;
  isLoading: boolean;
  namespace?: string;
}

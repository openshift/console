import * as React from 'react';
import { Link } from 'react-router-dom';
import { InProgressIcon, QuestionCircleIcon } from '@patternfly/react-icons';

import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import * as plugins from '../../../plugins';
import {
  LoadingInline,
} from '../../utils';
import { K8sResourceKind, K8sKind } from '../../../module/k8s';
import { InventoryStatusGroup } from './status-group';

const defaultStatusGroupIcons = {
  [InventoryStatusGroup.OK]: (
    <GreenCheckCircleIcon className="co-inventory-card__status-icon" />
  ),
  [InventoryStatusGroup.WARN]: (
    <YellowExclamationTriangleIcon className="co-inventory-card__status-icon" />
  ),
  [InventoryStatusGroup.ERROR]: (
    <RedExclamationCircleIcon className="co-inventory-card__status-icon" />
  ),
  [InventoryStatusGroup.PROGRESS]: (
    <InProgressIcon className="co-inventory-card__status-icon co-inventory-card__status-icon--progress" />
  ),
  [InventoryStatusGroup.NOT_MAPPED]: (
    <QuestionCircleIcon className="co-inventory-card__status-icon co-inventory-card__status-icon--question" />
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

export const InventoryItem: React.FC<InventoryItemProps> = React.memo(
  ({ isLoading, singularTitle, pluralTitle, count, children, error = false, ...props }) => {
    const title = count !== 1 ? pluralTitle : singularTitle;
    let status: React.ReactNode;
    if (error) {
      status = <div className="text-secondary">Unavailable</div>;
    } else if (isLoading) {
      status = <LoadingInline />;
    } else {
      status = children;
    }
    return (
      <div data-test-id={props['data-test-id']} className="co-inventory-card__item">
        <div className="co-inventory-card__item-title">{isLoading || error ? title : `${count} ${title}`}</div>
        <div className="co-inventory-card__item-status">{status}</div>
      </div>
    );
  }
);

export const Status: React.FC<StatusProps> = React.memo(({ groupID, count }) => {
  const statusGroupIcons = getStatusGroupIcons();
  const groupIcon = statusGroupIcons[groupID] || statusGroupIcons[InventoryStatusGroup.NOT_MAPPED];
  return (
    <div className="co-inventory-card__status">
      {groupIcon}
      <span className="co-inventory-card__status-text">{count}</span>
    </div>
  );
});

const StatusLink: React.FC<StatusLinkProps> = React.memo(({groupID, count, statusIDs, kind, namespace, filterType}) => {
  const statusItems = encodeURIComponent(statusIDs.join(','));
  const namespacePath = namespace ? `ns/${namespace}` : 'all-namespaces';
  const to = filterType && statusItems.length > 0 ? `/k8s/${namespacePath}/${kind.plural}?rowFilter-${filterType}=${statusItems}` : `/k8s/${namespacePath}/${kind.plural}`;
  const statusGroupIcons = getStatusGroupIcons();
  const groupIcon = statusGroupIcons[groupID] || statusGroupIcons[InventoryStatusGroup.NOT_MAPPED];
  const cleanStatusItems = statusIDs.join('-').toLowerCase();
  return (
    <div className="co-inventory-card__status">
      <Link to={to} style={{textDecoration: 'none'}}>
        {groupIcon}
        <span data-test-id={`console-dashboard-inventory-count-${ cleanStatusItems }`} className="co-inventory-card__status-text">{count}</span>
      </Link>
    </div>
  );
});

export const ResourceInventoryItem: React.FC<ResourceInventoryItemProps> = React.memo(
  ({ kind, useAbbr, resources, additionalResources, isLoading, mapper, namespace, error, ...props }) => {
    const groups = mapper(resources, additionalResources);
    const [singularTitle, pluralTitle] = useAbbr ? [kind.abbr, `${kind.abbr}s`] : [kind.label, kind.labelPlural];
    return (
      <InventoryItem
        isLoading={isLoading}
        singularTitle={singularTitle}
        pluralTitle={pluralTitle}
        count={resources.length}
        error={error}
        data-test-id={props['data-test-id']}
      >
        {Object.keys(groups).filter(key => groups[key].count > 0).map(key => (
          <StatusLink
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
  }
);

export type StatusGroupMapper = (resources: K8sResourceKind[], additionalResources?: {[key: string]: K8sResourceKind[]}) => {[key in InventoryStatusGroup | string]: {filterType?: string, statusIDs: string[], count: number}};

type InventoryItemProps = {
  isLoading: boolean;
  singularTitle: string;
  pluralTitle: string;
  count: number;
  children?: React.ReactNode;
  error: boolean;
  'data-test-id'?: string;
};

type StatusProps = {
  groupID: InventoryStatusGroup | string;
  count: number;
}

type StatusLinkProps = StatusProps & {
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
  error: boolean;
  'data-test-id'?: string;
}

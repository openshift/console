import * as React from 'react';
import { Link } from 'react-router-dom';
import { InProgressIcon, QuestionCircleIcon } from '@patternfly/react-icons';

import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import {
  LoadingInline,
} from '../../utils';
import { K8sResourceKind, K8sKind } from '../../../module/k8s';
import { InventoryStatusGroup } from './status-group';
import { connectToExtensions, isDashboardsInventoryItemGroup, Extension } from '@console/plugin-sdk';

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

export const InventoryItem: React.FC<InventoryItemProps> = React.memo(
  ({ isLoading, singularTitle, pluralTitle, count, children, error = false }) => {
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
      <div className="co-inventory-card__item">
        <div className="co-inventory-card__item-title">{isLoading || error ? title : `${count} ${title}`}</div>
        <div className="co-inventory-card__item-status">{status}</div>
      </div>
    );
  }
);

const mapExtensionsToProps = (extensions: Extension[]) => {
  const statusGroupIcons = {...defaultStatusGroupIcons};
  extensions.filter(isDashboardsInventoryItemGroup).forEach(group => {
    if (!statusGroupIcons[group.properties.id]) {
      statusGroupIcons[group.properties.id] = group.properties.icon;
    }
  });

  return {
    statusGroupIcons,
  };
};

export const Status = React.memo(connectToExtensions(mapExtensionsToProps)(
  ({ groupID, count, statusGroupIcons }: StatusProps) => {
    const groupIcon = statusGroupIcons[groupID] || statusGroupIcons[InventoryStatusGroup.NOT_MAPPED];
    return (
      <div className="co-inventory-card__status">
        {groupIcon}
        <span className="co-inventory-card__status-text">{count}</span>
      </div>
    );
  }
));

const StatusLink = React.memo(connectToExtensions(mapExtensionsToProps)(
  ({ groupID, count, statusIDs, kind, namespace, filterType, statusGroupIcons }: StatusLinkProps) => {
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
  }
));

export const ResourceInventoryItem: React.FC<ResourceInventoryItemProps> = React.memo(
  ({ kind, useAbbr, resources, additionalResources, isLoading, mapper, namespace, error }) => {
    const groups = mapper(resources, additionalResources);
    const [singularTitle, pluralTitle] = useAbbr ? [kind.abbr, `${kind.abbr}s`] : [kind.label, kind.labelPlural];
    return (
      <InventoryItem
        isLoading={isLoading}
        singularTitle={singularTitle}
        pluralTitle={pluralTitle}
        count={resources.length}
        error={error}
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
};

type StatusProps = {
  groupID: InventoryStatusGroup | string;
  count: number;
  statusGroupIcons: {[key in InventoryStatusGroup]: JSX.Element};
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
}

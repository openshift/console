import * as React from 'react';
import { Link } from 'react-router-dom';
import { InProgressIcon, QuestionCircleIcon } from '@patternfly/react-icons';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import {
  Accordion,
  AccordionItem,
  AccordionToggle,
  AccordionContent,
} from '@patternfly/react-core';
import { pluralize } from '@console/internal/components/utils';
import {
  useExtensions,
  DashboardsInventoryItemGroup,
  isDashboardsInventoryItemGroup,
} from '@console/plugin-sdk';
import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '../../status/icons';
import { InventoryStatusGroup } from './status-group';
import './inventory-card.scss';

const defaultStatusGroupIcons = {
  [InventoryStatusGroup.WARN]: <YellowExclamationTriangleIcon />,
  [InventoryStatusGroup.ERROR]: <RedExclamationCircleIcon />,
  [InventoryStatusGroup.PROGRESS]: (
    <InProgressIcon className="co-inventory-card__status-icon--progress" />
  ),
  [InventoryStatusGroup.UNKNOWN]: (
    <QuestionCircleIcon className="co-inventory-card__status-icon--question" />
  ),
};

const getStatusGroupIcons = (groups: DashboardsInventoryItemGroup[]) => {
  const groupStatusIcons = { ...defaultStatusGroupIcons };
  groups.forEach((group) => {
    if (!groupStatusIcons[group.properties.id]) {
      groupStatusIcons[group.properties.id] = group.properties.icon;
    }
  });
  return groupStatusIcons;
};

const getTop3Groups = (groups: DashboardsInventoryItemGroup[], groupIDs: string[]) => {
  const groupStatuses: (InventoryStatusGroup | string)[] = [
    InventoryStatusGroup.ERROR,
    InventoryStatusGroup.WARN,
    InventoryStatusGroup.PROGRESS,
  ];
  groups.forEach((group) => {
    if (!groupStatuses.includes(group.properties.id)) {
      groupStatuses.push(group.properties.id);
    }
  });
  groupStatuses.push(InventoryStatusGroup.UNKNOWN);
  return groupIDs.sort((a, b) => groupStatuses.indexOf(a) - groupStatuses.indexOf(b)).slice(0, 3);
};

export const InventoryItem: React.FC<InventoryItemProps> = React.memo(
  ({
    isLoading,
    title,
    titlePlural,
    count,
    children,
    error = false,
    TitleComponent,
    ExpandedComponent,
  }) => {
    const [expanded, setExpanded] = React.useState(false);
    const onClick = React.useCallback(() => setExpanded(!expanded), [expanded]);
    const titleMessage = pluralize(count, title, titlePlural, !isLoading && !error);
    return ExpandedComponent ? (
      <Accordion
        asDefinitionList={false}
        headingLevel="h5"
        className="co-inventory-card__accordion"
      >
        <AccordionItem>
          <AccordionToggle
            onClick={onClick}
            isExpanded={expanded}
            id={title}
            className="co-inventory-card__accordion-toggle"
          >
            <div className="co-inventory-card__item">
              <div className="co-inventory-card__item-title">
                {isLoading && !error && <div className="skeleton-inventory" />}
                {TitleComponent ? <TitleComponent>{titleMessage}</TitleComponent> : titleMessage}
              </div>
              {!expanded && (error || !isLoading) && (
                <div className="co-inventory-card__item-status">
                  {error ? (
                    <div className="co-dashboard-text--small text-secondary">Not available</div>
                  ) : (
                    children
                  )}
                </div>
              )}
            </div>
          </AccordionToggle>
          <AccordionContent isHidden={!expanded} className="co-inventory-card__accordion-body">
            <ExpandedComponent />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    ) : (
      <div className="co-inventory-card__item">
        <div className="co-inventory-card__item-title">
          {isLoading && !error && <div className="skeleton-inventory" />}
          {TitleComponent ? <TitleComponent>{titleMessage}</TitleComponent> : titleMessage}
        </div>
        {(error || !isLoading) && (
          <div className="co-inventory-card__item-status">
            {error ? (
              <div className="co-dashboard-text--small text-secondary">Not available</div>
            ) : (
              children
            )}
          </div>
        )}
      </div>
    );
  },
);

export const Status: React.FC<StatusProps> = ({ groupID, count }) => {
  const groupExtensions = useExtensions<DashboardsInventoryItemGroup>(
    isDashboardsInventoryItemGroup,
  );

  const statusGroupIcons = React.useMemo(() => getStatusGroupIcons(groupExtensions), [
    groupExtensions,
  ]);

  if (groupID === InventoryStatusGroup.NOT_MAPPED || !count) {
    return null;
  }

  const groupIcon = statusGroupIcons[groupID] || statusGroupIcons[InventoryStatusGroup.UNKNOWN];

  return (
    <div className="co-inventory-card__status">
      <span className="co-dashboard-icon">{groupIcon}</span>
      <span className="co-inventory-card__status-text">{count}</span>
    </div>
  );
};

const StatusLink: React.FC<StatusLinkProps> = ({
  groupID,
  count,
  statusIDs,
  kind,
  namespace,
  filterType,
  basePath,
}) => {
  const groupExtensions = useExtensions<DashboardsInventoryItemGroup>(
    isDashboardsInventoryItemGroup,
  );

  const statusGroupIcons = React.useMemo(() => getStatusGroupIcons(groupExtensions), [
    groupExtensions,
  ]);

  if (groupID === InventoryStatusGroup.NOT_MAPPED || !count) {
    return null;
  }

  const groupIcon = statusGroupIcons[groupID] || statusGroupIcons[InventoryStatusGroup.NOT_MAPPED];
  const statusItems = encodeURIComponent(statusIDs.join(','));
  const path = basePath || resourcePathFromModel(kind, null, namespace);
  const to =
    filterType && statusItems.length > 0 ? `${path}?rowFilter-${filterType}=${statusItems}` : path;

  return (
    <div className="co-inventory-card__status">
      <Link to={to} style={{ textDecoration: 'none' }}>
        <span className="co-dashboard-icon">{groupIcon}</span>
        <span className="co-inventory-card__status-text">{count}</span>
      </Link>
    </div>
  );
};

const ResourceTitleComponent: React.FC<ResourceTitleComponentComponent> = ({
  kind,
  namespace,
  children,
  basePath,
}) => <Link to={basePath || resourcePathFromModel(kind, null, namespace)}>{children}</Link>;

export const ResourceInventoryItem: React.FC<ResourceInventoryItemProps> = ({
  kind,
  useAbbr,
  TitleComponent,
  resources = [],
  additionalResources,
  isLoading,
  mapper,
  namespace,
  error,
  showLink = true,
  ExpandedComponent,
  basePath,
}) => {
  let Title: React.ComponentType = React.useCallback(
    (props) => (
      <ResourceTitleComponent kind={kind} namespace={namespace} basePath={basePath} {...props} />
    ),
    [kind, namespace, basePath],
  );

  if (TitleComponent) Title = TitleComponent;

  const groupExtensions = useExtensions<DashboardsInventoryItemGroup>(
    isDashboardsInventoryItemGroup,
  );

  const groups = React.useMemo(() => (mapper ? mapper(resources, additionalResources) : {}), [
    mapper,
    resources,
    additionalResources,
  ]);

  const top3Groups = React.useMemo(
    () =>
      getTop3Groups(
        groupExtensions,
        Object.keys(groups).filter((key) => groups[key].count > 0),
      ),
    [groupExtensions, groups],
  );

  // The count can depend on additionalResources (like mixing of VM and VMI for kubevirt-plugin)
  const totalCount = React.useMemo(
    () =>
      mapper
        ? Object.keys(groups).reduce((acc, cur) => groups[cur].count + acc, 0)
        : resources.length,
    [mapper, groups, resources],
  );

  return (
    <InventoryItem
      isLoading={isLoading}
      title={useAbbr ? kind.abbr : kind.label}
      titlePlural={useAbbr ? undefined : kind.labelPlural}
      count={totalCount}
      error={error}
      TitleComponent={showLink ? Title : null}
      ExpandedComponent={ExpandedComponent}
    >
      {top3Groups.map((key) =>
        showLink ? (
          <StatusLink
            key={key}
            kind={kind}
            namespace={namespace}
            groupID={key}
            count={groups[key].count}
            statusIDs={groups[key].statusIDs}
            filterType={groups[key].filterType}
            basePath={basePath}
          />
        ) : (
          <Status key={key} groupID={key} count={groups[key].count} />
        ),
      )}
    </InventoryItem>
  );
};

export default InventoryItem;

type StatusGroup = {
  [key in InventoryStatusGroup | string]: {
    filterType?: string;
    statusIDs: string[];
    count: number;
  };
};

export type StatusGroupMapper = (
  resources: K8sResourceKind[],
  additionalResources?: { [key: string]: K8sResourceKind[] },
) => StatusGroup;

type InventoryItemProps = {
  isLoading: boolean;
  title: string;
  titlePlural?: string;
  count: number;
  children?: React.ReactNode;
  error?: boolean;
  TitleComponent?: React.ComponentType<{}>;
  ExpandedComponent?: React.ComponentType<{}>;
};

type StatusProps = {
  groupID: InventoryStatusGroup | string;
  count: number;
};

type StatusLinkProps = StatusProps & {
  statusIDs: string[];
  kind: K8sKind;
  namespace?: string;
  filterType?: string;
  basePath?: string;
};

export type ExpandedComponentProps = {
  resource: K8sResourceKind[];
  additionalResources?: { [key: string]: K8sResourceKind[] };
};

type ResourceInventoryItemProps = {
  resources: K8sResourceKind[];
  additionalResources?: { [key: string]: K8sResourceKind[] };
  mapper?: StatusGroupMapper;
  kind: K8sKind;
  useAbbr?: boolean;
  isLoading: boolean;
  namespace?: string;
  error: boolean;
  showLink?: boolean;
  TitleComponent?: React.ComponentType<{}>;
  ExpandedComponent?: React.ComponentType<{}>;
  basePath?: string;
};

type ResourceTitleComponentComponent = {
  kind: K8sKind;
  namespace: string;
  basePath?: string;
};

import * as React from 'react';
import { Link } from 'react-router-dom';
import { InProgressIcon, QuestionCircleIcon } from '@patternfly/react-icons';
import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '@console/shared';
import { FlagsObject, WithFlagsProps, connectToFlags } from '@console/internal/reducers/features';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import {
  Accordion,
  AccordionItem,
  AccordionToggle,
  AccordionContent,
} from '@patternfly/react-core';
import * as plugins from '@console/internal/plugins';
import { pluralize } from '@console/internal/components/utils';
import { isDashboardsInventoryItemGroup } from '@console/plugin-sdk';
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

const getTop3Groups = (groupIDs: string[], flags: FlagsObject) => {
  const groupStatuses: (InventoryStatusGroup | string)[] = [
    InventoryStatusGroup.ERROR,
    InventoryStatusGroup.WARN,
    InventoryStatusGroup.PROGRESS,
  ];
  plugins.registry
    .getDashboardsInventoryItemGroups()
    .filter((e) => plugins.registry.isExtensionInUse(e, flags))
    .forEach((group) => {
      if (!groupStatuses.includes(group.properties.id)) {
        groupStatuses.push(group.properties.id);
      }
    });
  groupStatuses.push(InventoryStatusGroup.UNKNOWN);
  return groupIDs.sort((a, b) => groupStatuses.indexOf(b) - groupStatuses.indexOf(a)).slice(0, 3);
};

const getStatusGroupIcons = (flags: FlagsObject) => {
  const groupStatusIcons = { ...defaultStatusGroupIcons };
  plugins.registry
    .getDashboardsInventoryItemGroups()
    .filter((e) => plugins.registry.isExtensionInUse(e, flags))
    .forEach((group) => {
      if (!groupStatusIcons[group.properties.id]) {
        groupStatusIcons[group.properties.id] = group.properties.icon;
      }
    });
  return groupStatusIcons;
};

const InventoryItem: React.FC<InventoryItemProps> = React.memo(
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
    const titleMessage = isLoading || error ? title : pluralize(count, title, titlePlural);
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

export const Status = connectToFlags<StatusProps>(
  ...plugins.registry.getRequiredFlags([isDashboardsInventoryItemGroup]),
)(({ groupID, count, flags }) => {
  if (groupID === InventoryStatusGroup.NOT_MAPPED || !count) {
    return null;
  }
  const statusGroupIcons = getStatusGroupIcons(flags);
  const groupIcon = statusGroupIcons[groupID] || statusGroupIcons[InventoryStatusGroup.UNKNOWN];
  return (
    <div className="co-inventory-card__status">
      <span className="co-dashboard-icon">{groupIcon}</span>
      <span className="co-inventory-card__status-text">{count}</span>
    </div>
  );
});

const StatusLink = connectToFlags<StatusLinkProps>(
  ...plugins.registry.getRequiredFlags([isDashboardsInventoryItemGroup]),
)(({ groupID, count, statusIDs, kind, namespace, filterType, flags, basePath }) => {
  if (groupID === InventoryStatusGroup.NOT_MAPPED || !count) {
    return null;
  }
  const statusItems = encodeURIComponent(statusIDs.join(','));
  const namespacePath = namespace ? `ns/${namespace}` : 'all-namespaces';
  const path = basePath || `/k8s/${namespacePath}/${kind.plural}`;
  const to =
    filterType && statusItems.length > 0 ? `${path}?rowFilter-${filterType}=${statusItems}` : path;
  const statusGroupIcons = getStatusGroupIcons(flags);
  const groupIcon = statusGroupIcons[groupID] || statusGroupIcons[InventoryStatusGroup.NOT_MAPPED];
  return (
    <div className="co-inventory-card__status">
      <Link to={to} style={{ textDecoration: 'none' }}>
        <span className="co-dashboard-icon">{groupIcon}</span>
        <span className="co-inventory-card__status-text">{count}</span>
      </Link>
    </div>
  );
});

const ResourceTitleComponent: React.FC<ResourceTitleComponentComponent> = ({
  kind,
  namespace,
  children,
  basePath,
}) => <Link to={basePath || resourcePathFromModel(kind, null, namespace)}>{children}</Link>;

export const ResourceInventoryItem = connectToFlags<ResourceInventoryItemProps>(
  ...plugins.registry.getRequiredFlags([isDashboardsInventoryItemGroup]),
)(
  ({
    kind,
    useAbbr,
    resources = [],
    additionalResources,
    isLoading,
    mapper,
    namespace,
    error,
    showLink = true,
    flags = {},
    ExpandedComponent,
    basePath,
  }) => {
    const TitleComponent = React.useCallback(
      (props) => (
        <ResourceTitleComponent kind={kind} namespace={namespace} basePath={basePath} {...props} />
      ),
      [kind, namespace, basePath],
    );

    const groups = mapper ? mapper(resources, additionalResources) : {};
    const top3Groups = getTop3Groups(
      Object.keys(groups).filter((key) => groups[key].count > 0),
      flags,
    );
    return (
      <InventoryItem
        isLoading={isLoading}
        title={useAbbr ? kind.abbr : kind.label}
        titlePlural={useAbbr ? undefined : kind.labelPlural}
        count={resources.length}
        error={error}
        TitleComponent={showLink ? TitleComponent : null}
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
  },
);

export default InventoryItem;

type StatusGroup = {
  [key in InventoryStatusGroup | string]: {
    filterType?: string;
    statusIDs: string[];
    count: number;
  }
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

type StatusProps = WithFlagsProps & {
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

type ResourceInventoryItemProps = WithFlagsProps & {
  resources: K8sResourceKind[];
  additionalResources?: { [key: string]: K8sResourceKind[] };
  mapper?: StatusGroupMapper;
  kind: K8sKind;
  useAbbr?: boolean;
  isLoading: boolean;
  namespace?: string;
  error: boolean;
  showLink?: boolean;
  ExpandedComponent?: React.ComponentType<{}>;
  basePath?: string;
};

type ResourceTitleComponentComponent = {
  kind: K8sKind;
  namespace: string;
  basePath?: string;
};

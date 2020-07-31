import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, Button, SplitItem, Split } from '@patternfly/react-core';
import { OverviewItem, Status, HealthChecksAlert } from '@console/shared';
import {
  ActionsMenu,
  FirehoseResult,
  KebabAction,
  KebabOption,
  ResourceIcon,
  resourcePath,
  ResourceStatus,
} from './index';
import { connectToModel } from '../../kinds';
import {
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  referenceForModel,
} from '../../module/k8s';
import { ResourceItemDeleting } from '../overview/project-overview';
import { ManagedByOperatorLink } from './managed-by';

export const BreadCrumbs: React.SFC<BreadCrumbsProps> = ({ breadcrumbs }) => (
  <Breadcrumb>
    {breadcrumbs.map((crumb, i, { length }) => {
      const isLast = i === length - 1;

      return (
        <BreadcrumbItem key={i} isActive={isLast}>
          {isLast ? (
            crumb.name
          ) : (
            <Link
              className="pf-c-breadcrumb__link"
              to={crumb.path}
              data-test-id={`breadcrumb-link-${i}`}
            >
              {crumb.name}
            </Link>
          )}
        </BreadcrumbItem>
      );
    })}
  </Breadcrumb>
);

export const ActionButtons: React.SFC<ActionButtonsProps> = ({ actionButtons }) => (
  <div className="co-action-buttons">
    {_.map(actionButtons, (actionButton, i) => {
      if (!_.isEmpty(actionButton)) {
        return (
          <Button
            className="co-action-buttons__btn"
            variant="primary"
            onClick={actionButton.callback}
            key={i}
          >
            {actionButton.label}
          </Button>
        );
      }
    })}
  </div>
);

export const PageHeading = connectToModel((props: PageHeadingProps) => {
  const {
    kind,
    kindObj,
    detail,
    title,
    menuActions,
    buttonActions,
    obj,
    breadcrumbsFor,
    titleFunc,
    style,
    customData,
    badge,
    getResourceStatus = (resource: K8sResourceKind): string =>
      _.get(resource, ['status', 'phase'], null),
    className,
  } = props;
  const extraResources = _.reduce(
    props.resourceKeys,
    (extraObjs, key) => ({ ...extraObjs, [key]: _.get(props[key], 'data') }),
    {},
  );
  const data = _.get(obj, 'data');
  const resourceTitle = titleFunc && data ? titleFunc(data) : title;
  const hasButtonActions = !_.isEmpty(buttonActions);
  const hasMenuActions = _.isFunction(menuActions) || !_.isEmpty(menuActions);
  const hasData = !_.isEmpty(data);
  const showActions =
    (hasButtonActions || hasMenuActions) && hasData && !_.get(data, 'metadata.deletionTimestamp');
  const resourceStatus = hasData && getResourceStatus ? getResourceStatus(data) : null;
  const showHeading = props.icon || kind || resourceTitle || resourceStatus || badge || showActions;
  return (
    <div
      className={classNames(
        'co-m-nav-title',
        { 'co-m-nav-title--detail': detail },
        { 'co-m-nav-title--logo': props.icon },
        { 'co-m-nav-title--breadcrumbs': breadcrumbsFor && !_.isEmpty(data) },
        className,
      )}
      style={style}
    >
      {breadcrumbsFor && !_.isEmpty(data) && (
        <Split style={{ alignItems: 'baseline' }}>
          <SplitItem isFilled>
            <BreadCrumbs breadcrumbs={breadcrumbsFor(data)} />
          </SplitItem>
          {badge && (
            <SplitItem>{<span className="co-m-pane__heading-badge">{badge}</span>}</SplitItem>
          )}
        </Split>
      )}
      {showHeading && (
        <h1
          className={classNames('co-m-pane__heading', { 'co-m-pane__heading--logo': props.icon })}
        >
          {props.icon ? (
            <props.icon obj={data} />
          ) : (
            <div className="co-m-pane__name co-resource-item">
              {kind && <ResourceIcon kind={kind} className="co-m-resource-icon--lg" />}{' '}
              <span data-test-id="resource-title" className="co-resource-item__resource-name">
                {resourceTitle}
                {data?.metadata?.namespace && data?.metadata?.ownerReferences?.length && (
                  <ManagedByOperatorLink obj={data} />
                )}
              </span>
              {resourceStatus && (
                <ResourceStatus additionalClassNames="hidden-xs">
                  <Status status={resourceStatus} />
                </ResourceStatus>
              )}
            </div>
          )}
          {!breadcrumbsFor && badge && <span className="co-m-pane__heading-badge">{badge}</span>}
          {showActions && (
            <div className="co-actions" data-test-id="details-actions">
              {hasButtonActions && (
                <ActionButtons actionButtons={buttonActions.map((a) => a(kindObj, data))} />
              )}
              {hasMenuActions && (
                <ActionsMenu
                  actions={
                    _.isFunction(menuActions)
                      ? menuActions(kindObj, data, extraResources, customData)
                      : menuActions.map((a) => a(kindObj, data, extraResources, customData))
                  }
                />
              )}
            </div>
          )}
        </h1>
      )}
      {props.children}
    </div>
  );
});

export const SectionHeading: React.SFC<SectionHeadingProps> = ({
  text,
  children,
  style,
  required,
  id,
}) => (
  <h2 className="co-section-heading" style={style} data-test-section-heading={text} id={id}>
    <span
      className={classNames({
        'co-required': required,
      })}
    >
      {text}
    </span>
    {children}
  </h2>
);

export const SidebarSectionHeading: React.SFC<SidebarSectionHeadingProps> = ({
  text,
  children,
  style,
  className,
}) => (
  <h2 className={`sidebar__section-heading ${className}`} style={style}>
    {text}
    {children}
  </h2>
);

export const ResourceOverviewHeading: React.SFC<ResourceOverviewHeadingProps> = ({
  kindObj,
  actions,
  resources,
}) => {
  const { obj: resource, ...otherResources } = resources;
  const isDeleting = !!resource.metadata.deletionTimestamp;
  return (
    <div className="overview__sidebar-pane-head resource-overview__heading">
      <h1 className="co-m-pane__heading">
        <div className="co-m-pane__name co-resource-item">
          <ResourceIcon
            className="co-m-resource-icon--lg"
            kind={kindObj.crd ? referenceForModel(kindObj) : resource.kind}
          />
          <Link
            to={resourcePath(
              kindObj.crd ? referenceForModel(kindObj) : resource.kind,
              resource.metadata.name,
              resource.metadata.namespace,
            )}
            className="co-resource-item__resource-name"
          >
            {resource.metadata.name}
          </Link>
          {isDeleting && <ResourceItemDeleting />}
        </div>
        {!isDeleting && (
          <div className="co-actions">
            <ActionsMenu actions={actions.map((a) => a(kindObj, resource, otherResources))} />
          </div>
        )}
      </h1>
      <HealthChecksAlert resource={resource} />
    </div>
  );
};

export type ActionButtonsProps = {
  actionButtons: any[];
};

export type BreadCrumbsProps = {
  breadcrumbs: { name: string; path: string }[];
};

export type KebabOptionsCreator = (
  kindObj: K8sKind,
  data: K8sResourceKind,
  extraResources?: { [prop: string]: K8sResourceKind | K8sResourceKind[] },
  customData?: any,
) => KebabOption[];

export type PageHeadingProps = {
  breadcrumbsFor?: (obj: K8sResourceKind) => { name: string; path: string }[];
  buttonActions?: any[];
  children?: React.ReactChildren;
  detail?: boolean;
  kind?: K8sResourceKindReference;
  kindObj?: K8sKind;
  menuActions?: Function[] | KebabOptionsCreator; // FIXME should be "KebabAction[] |" refactor pipeline-actions.tsx, etc.
  obj?: FirehoseResult<K8sResourceKind>;
  resourceKeys?: string[];
  style?: object;
  title?: string | JSX.Element;
  titleFunc?: (obj: K8sResourceKind) => string | JSX.Element;
  customData?: any;
  badge?: React.ReactNode;
  icon?: React.ComponentType<{ obj?: K8sResourceKind }>;
  getResourceStatus?: (resource: K8sResourceKind) => string;
  className?: string;
};

export type ResourceOverviewHeadingProps = {
  actions: KebabAction[];
  kindObj: K8sKind;
  resources?: OverviewItem;
};

export type SectionHeadingProps = {
  children?: any;
  style?: any;
  text: string;
  required?: boolean;
  id?: string;
};

export type SidebarSectionHeadingProps = {
  children?: any;
  style?: any;
  className?: string;
  text: string;
};

BreadCrumbs.displayName = 'BreadCrumbs';
PageHeading.displayName = 'PageHeading';
ResourceOverviewHeading.displayName = 'ResourceOverviewHeading';
SectionHeading.displayName = 'SectionHeading';
SidebarSectionHeading.displayName = 'SidebarSectionHeading';

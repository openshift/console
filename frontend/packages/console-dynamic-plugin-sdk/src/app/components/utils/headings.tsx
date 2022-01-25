import * as React from 'react';
import { Breadcrumb, BreadcrumbItem, Button, SplitItem, Split } from '@patternfly/react-core';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { ActionsMenu, ResourceIcon } from '@console/internal/components/utils'; // ??! TODO use direct imports instead
import { ManagedByOperatorLink } from '@console/internal/components/utils/managed-by'; // ??! TODO add user-defined callback allowing to pass this
import { K8sKind } from '../../../api/common-types';
import {
  FirehoseResult,
  KebabOption,
  K8sResourceKindReference,
} from '../../../extensions/console-types';
import { K8sResourceKind } from '../../k8s/actions/k8s';
import { connectToModel } from '../../kinds';
import Status from '../status/Status';
import { ResourceStatus } from './resource-status';

export const BreadCrumbs: React.SFC<BreadCrumbsProps> = ({ breadcrumbs }) => (
  <Breadcrumb>
    {breadcrumbs.map((crumb, i, { length }) => {
      const isLast = i === length - 1;

      return (
        // eslint-disable-next-line react/no-array-index-key
        <BreadcrumbItem key={i} isActive={isLast}>
          {isLast ? (
            crumb.name
          ) : (
            <Link
              className="pf-c-breadcrumb__link"
              to={crumb.path}
              // eslint-disable-next-line react/no-array-index-key
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
      return null;
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
    customActionMenu,
    obj,
    breadcrumbs,
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
    (hasButtonActions || hasMenuActions || customActionMenu) &&
    hasData &&
    !_.get(data, 'metadata.deletionTimestamp');
  const resourceStatus = hasData && getResourceStatus ? getResourceStatus(data) : null;
  const showHeading = props.icon || kind || resourceTitle || resourceStatus || badge || showActions;
  const showBreadcrumbs = breadcrumbs || (breadcrumbsFor && !_.isEmpty(data));
  return (
    <div
      className={classNames(
        'co-m-nav-title',
        { 'co-m-nav-title--detail': detail },
        { 'co-m-nav-title--logo': props.icon },
        { 'co-m-nav-title--breadcrumbs': showBreadcrumbs },
        className,
      )}
      style={style}
    >
      {showBreadcrumbs && (
        <Split style={{ alignItems: 'baseline' }}>
          <SplitItem isFilled>
            <BreadCrumbs breadcrumbs={breadcrumbs || breadcrumbsFor(data)} />
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
          {!breadcrumbsFor && !breadcrumbs && badge && (
            <span className="co-m-pane__heading-badge">{badge}</span>
          )}
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
              {_.isFunction(customActionMenu) ? customActionMenu(kindObj, data) : customActionMenu}
            </div>
          )}
        </h1>
      )}
      {props.children}
    </div>
  );
});

export type KebabOptionsCreator = (
  kindObj: K8sKind,
  data: K8sResourceKind,
  extraResources?: { [prop: string]: K8sResourceKind | K8sResourceKind[] },
  customData?: any,
) => KebabOption[];

export type ActionButtonsProps = {
  actionButtons: any[];
};

export type BreadCrumbsProps = {
  breadcrumbs: { name: string; path: string }[];
};

export type PageHeadingProps = {
  breadcrumbs?: { name: string; path: string }[];
  breadcrumbsFor?: (obj: K8sResourceKind) => { name: string; path: string }[];
  buttonActions?: any[];
  children?: React.ReactChildren;
  detail?: boolean;
  kind?: K8sResourceKindReference;
  kindObj?: K8sKind;
  menuActions?: Function[] | KebabOptionsCreator; // FIXME should be "KebabAction[] |" refactor pipeline-actions.tsx, etc.
  customActionMenu?:
    | React.ReactNode
    | ((kindObj: K8sKind, obj: K8sResourceKind) => React.ReactNode); // Renders a custom action menu.
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

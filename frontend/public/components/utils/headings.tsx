import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Title,
} from '@patternfly/react-core';
import { PageHeader, PageHeaderLinkProps } from '@patternfly/react-component-groups';
import { ResourceStatus, useActivePerspective } from '@console/dynamic-plugin-sdk';
import { Status, YellowExclamationTriangleIcon } from '@console/shared';
import SecondaryHeading from '@console/shared/src/components/heading/SecondaryHeading';
import { FavoriteButton } from '@console/app/src/components/favorite/FavoriteButton';
import { LinkTo } from '@console/shared/src/components/links/LinkTo';

import { ActionsMenu, FirehoseResult, KebabOption, ResourceIcon } from './index';
import { connectToModel } from '../../kinds';
import { K8sKind, K8sResourceKind, K8sResourceKindReference } from '../../module/k8s';
import { ManagedByOperatorLink } from './managed-by';

export const ResourceItemDeleting = () => {
  const { t } = useTranslation();
  return (
    <span className="co-resource-item__deleting">
      <YellowExclamationTriangleIcon /> {t('public~Deleting')}
    </span>
  );
};

export const BreadCrumbs: React.FCC<BreadCrumbsProps> = ({ breadcrumbs }) => (
  <Breadcrumb data-test="page-heading-breadcrumbs">
    {breadcrumbs.map((crumb, i, { length }) => {
      return (
        <BreadcrumbItem
          to={crumb.path}
          key={i}
          data-test-id={`breadcrumb-link-${i}`}
          isActive={i === length - 1}
          component={LinkTo(crumb.path)}
        >
          {crumb.name}
        </BreadcrumbItem>
      );
    })}
  </Breadcrumb>
);

export const ActionButtons: React.FCC<ActionButtonsProps> = ({ actionButtons }) => (
  <>
    {_.map(actionButtons, (actionButton, i) => {
      if (!_.isEmpty(actionButton)) {
        return (
          <ActionListItem>
            <Button
              className="co-action-buttons__btn"
              variant="primary"
              onClick={actionButton.callback}
              key={i}
              data-test={actionButton.label}
            >
              {actionButton.label}
            </Button>
          </ActionListItem>
        );
      }
    })}
  </>
);

export const PageHeading = connectToModel((props: PageHeadingProps) => {
  const {
    'data-test': dataTestId,
    badge,
    breadcrumbs,
    breadcrumbsFor,
    buttonActions,
    children,
    className,
    customActionMenu,
    customData,
    getResourceStatus = (resource: K8sResourceKind): string =>
      _.get(resource, ['status', 'phase'], null),
    helpAlert,
    helpText,
    hideFavoriteButton,
    icon,
    kind,
    kindObj,
    linkProps,
    menuActions,
    obj,
    OverrideTitle,
    title,
    titleFunc,
    primaryAction,
  } = props;
  const [perspective] = useActivePerspective();
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
  const showBreadcrumbs = breadcrumbs || (breadcrumbsFor && !_.isEmpty(data));
  const isAdminPerspective = perspective === 'admin';

  return (
    <div
      data-test={dataTestId ?? 'page-heading'}
      className={classNames('co-m-nav-title', className)}
    >
      <PageHeader
        title={
          OverrideTitle ? (
            <OverrideTitle obj={data} />
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
          )
        }
        actionMenu={
          ((isAdminPerspective && !hideFavoriteButton) || showActions || primaryAction) && (
            <ActionList className="co-actions" data-test-id="details-actions">
              <ActionListGroup>
                {isAdminPerspective && !hideFavoriteButton && (
                  <ActionListItem>
                    <FavoriteButton />
                  </ActionListItem>
                )}

                {primaryAction}

                {showActions && (
                  <>
                    {hasButtonActions && (
                      <ActionButtons actionButtons={buttonActions.map((a) => a(kindObj, data))} />
                    )}

                    {hasMenuActions && (
                      <ActionListItem>
                        <ActionsMenu
                          actions={
                            _.isFunction(menuActions)
                              ? menuActions(kindObj, data, extraResources, customData)
                              : menuActions.map((a) => a(kindObj, data, extraResources, customData))
                          }
                        />
                      </ActionListItem>
                    )}

                    {_.isFunction(customActionMenu)
                      ? customActionMenu(kindObj, data)
                      : customActionMenu}
                  </>
                )}
              </ActionListGroup>
            </ActionList>
          )
        }
        breadcrumbs={
          showBreadcrumbs && <BreadCrumbs breadcrumbs={breadcrumbs || breadcrumbsFor(data)} />
        }
        subtitle={helpText}
        icon={icon}
        label={badge}
        linkProps={linkProps}
      >
        {helpAlert && helpAlert}
        {children}
      </PageHeader>
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
  <SecondaryHeading style={style} data-test-section-heading={text} id={id}>
    <span
      className={classNames({
        'co-required': required,
      })}
    >
      {text}
    </span>
    {children}
  </SecondaryHeading>
);

export const SidebarSectionHeading: React.SFC<SidebarSectionHeadingProps> = ({
  text,
  children,
  style,
  className,
}) => (
  <Title headingLevel="h2" className={`sidebar__section-heading ${className}`} style={style}>
    {text}
    {children}
  </Title>
);

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
  'data-test'?: string;
  /** A badge that is displayed next to the title of the heading */
  badge?: React.ReactNode;
  breadcrumbs?: { name: string; path: string }[];
  breadcrumbsFor?: (obj: K8sResourceKind) => { name: string; path: string }[];
  buttonActions?: any[];
  children?: React.ReactChildren;
  className?: string;
  /** Renders a custom action menu if the `obj` prop is passed with `data` */
  customActionMenu?:
    | React.ReactNode
    | ((kindObj: K8sKind, obj: K8sResourceKind) => React.ReactNode);
  customData?: any;
  getResourceStatus?: (resource: K8sResourceKind) => string;
  /** An alert placed below the heading in the same PageSection. */
  helpAlert?: React.ReactNode;
  /** A subtitle placed below the title. */
  helpText?: React.ReactNode;
  /** An icon which is placed next to the title with a divider line */
  icon?: React.ReactNode;
  /** Whether to hide the favorite button */
  hideFavoriteButton?: boolean;
  /** A component to override the title of the page */
  OverrideTitle?: React.ComponentType<{ obj?: K8sResourceKind }>;
  kind?: K8sResourceKindReference;
  kindObj?: K8sKind;
  /** Optional link below subtitle */
  linkProps?: PageHeaderLinkProps;
  menuActions?: Function[] | KebabOptionsCreator; // FIXME should be "KebabAction[] |" refactor pipeline-actions.tsx, etc.
  obj?: FirehoseResult<K8sResourceKind>;
  /** A primary action that is always rendered. */
  primaryAction?: React.ReactNode;
  resourceKeys?: string[];
  title?: string | JSX.Element;
  titleFunc?: (obj: K8sResourceKind) => string | JSX.Element;
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
SectionHeading.displayName = 'SectionHeading';
SidebarSectionHeading.displayName = 'SidebarSectionHeading';

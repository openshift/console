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

/** A `PageHeading` without connections to the redux store. */
export const BasePageHeading = ({
  'data-test': dataTestId = 'page-heading',
  badge,
  breadcrumbs,
  className,
  helpAlert,
  helpText,
  icon,
  hideFavoriteButton,
  title,
  primaryAction,
  linkProps,
}: BasePageHeadingProps) => {
  const [perspective] = useActivePerspective();
  const isAdminPerspective = perspective === 'admin';
  const showFavoriteButton = isAdminPerspective && !hideFavoriteButton;

  return (
    <div data-test={dataTestId} className={classNames('co-page-heading', className)}>
      <PageHeader
        breadcrumbs={breadcrumbs && <BreadCrumbs breadcrumbs={breadcrumbs} />}
        title={title}
        actionMenu={
          showFavoriteButton || primaryAction ? (
            <ActionList className="co-actions" data-test-id="details-actions">
              <ActionListGroup>
                {showFavoriteButton && (
                  <ActionListItem>
                    <FavoriteButton />
                  </ActionListItem>
                )}
                {primaryAction}
              </ActionListGroup>
            </ActionList>
          ) : null
        }
        icon={icon}
        label={badge}
        linkProps={linkProps}
        subtitle={helpText}
      >
        {helpAlert && helpAlert}
      </PageHeader>
    </div>
  );
};

export const PageHeading = connectToModel((props: PageHeadingProps) => {
  const {
    'data-test': dataTestId,
    badge,
    breadcrumbs,
    breadcrumbsFor,
    buttonActions,
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

  return (
    <BasePageHeading
      data-test={dataTestId}
      badge={badge}
      breadcrumbs={breadcrumbs || (!_.isEmpty(data) ? breadcrumbsFor(data) : null)}
      className={className}
      helpAlert={helpAlert}
      helpText={helpText}
      icon={icon}
      hideFavoriteButton={hideFavoriteButton}
      linkProps={linkProps}
      title={
        OverrideTitle ? (
          <OverrideTitle obj={data} />
        ) : (
          (kind || resourceTitle || resourceStatus) && (
            <div className="co-m-pane__heading co-m-pane__name co-resource-item">
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
        )
      }
      primaryAction={
        <>
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

              {_.isFunction(customActionMenu) ? customActionMenu(kindObj, data) : customActionMenu}
            </>
          )}
        </>
      }
    />
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

export type BasePageHeadingProps = {
  'data-test'?: string;
  /** A badge that is displayed next to the title of the heading */
  badge?: React.ReactNode;
  /** Breadcrumbs to be displayed above the title */
  breadcrumbs?: { name: string; path: string }[];
  /** A class name that is placed around the PageHeader wrapper */
  className?: string;
  /** An alert placed below the heading in the same PageSection. */
  helpAlert?: React.ReactNode;
  /** A subtitle placed below the title. */
  helpText?: React.ReactNode;
  /** An icon which is placed next to the title with a divider line */
  icon?: React.ReactNode;
  /** By default the favourites button is only shown when on the administrator perspective.
   * This prop allows you to hide the button in the administrator perspective. */
  hideFavoriteButton?: boolean;
  /** A title for the page. */
  title?: string | JSX.Element;
  /** A primary action that is always rendered. */
  primaryAction?: React.ReactNode;
  /** Optional link below subtitle */
  linkProps?: PageHeaderLinkProps | { label: React.ReactElement };
};

export type PageHeadingProps = BasePageHeadingProps & {
  breadcrumbsFor?: (obj: K8sResourceKind) => { name: string; path: string }[];
  buttonActions?: any[];
  /** Renders a custom action menu if the `obj` prop is passed with `data` */
  customActionMenu?:
    | React.ReactNode
    | ((kindObj: K8sKind, obj: K8sResourceKind) => React.ReactNode);
  customData?: any;
  getResourceStatus?: (resource: K8sResourceKind) => string;
  kind?: K8sResourceKindReference;
  kindObj?: K8sKind;
  menuActions?: Function[] | KebabOptionsCreator; // FIXME should be "KebabAction[] |" refactor pipeline-actions.tsx, etc.
  obj?: FirehoseResult<K8sResourceKind>;
  /** A component to override the title of the page */
  OverrideTitle?: React.ComponentType<{ obj?: K8sResourceKind }>;
  resourceKeys?: string[];
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

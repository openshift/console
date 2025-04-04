import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  ContentVariants,
  PageBreadcrumb,
  PageSection,
  Split,
  SplitItem,
  Title,
} from '@patternfly/react-core';
import { ResourceStatus, useActivePerspective } from '@console/dynamic-plugin-sdk';
import { Status, YellowExclamationTriangleIcon } from '@console/shared';
import PrimaryHeading from '@console/shared/src/components/heading/PrimaryHeading';
import SecondaryHeading from '@console/shared/src/components/heading/SecondaryHeading';
import { FavoriteButton } from '@console/app/src/components/favorite/FavoriteButton';
import NavTitle from '@console/shared/src/components/layout/NavTitle';

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

export const BreadCrumbs: React.SFC<BreadCrumbsProps> = ({ breadcrumbs }) => (
  <Breadcrumb className="co-breadcrumb">
    {breadcrumbs.map((crumb, i, { length }) => {
      const isLast = i === length - 1;

      return (
        <BreadcrumbItem key={i} isActive={isLast}>
          {isLast ? (
            crumb.name
          ) : (
            <Link
              className="pf-v6-c-breadcrumb__link"
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
    kind,
    kindObj,
    title,
    menuActions,
    buttonActions,
    customActionMenu,
    link,
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
    helpText,
    'data-test': dataTestId,
    hideFavoriteButton,
    children,
    navTitleAsRow,
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
  const showHeading = props.icon || kind || resourceTitle || resourceStatus || badge || showActions;
  const showBreadcrumbs = breadcrumbs || (breadcrumbsFor && !_.isEmpty(data));
  const isAdminPerspective = perspective === 'admin';
  return (
    <>
      {showBreadcrumbs && (
        <PageBreadcrumb>
          <Split style={{ alignItems: 'baseline' }}>
            <SplitItem isFilled>
              <BreadCrumbs breadcrumbs={breadcrumbs || breadcrumbsFor(data)} />
            </SplitItem>
            {badge && (
              <SplitItem>{<span className="co-m-pane__heading-badge">{badge}</span>}</SplitItem>
            )}
          </Split>
        </PageBreadcrumb>
      )}
      <NavTitle
        data-test-id={dataTestId}
        className={classNames(
          { 'co-m-nav-title--breadcrumbs': showBreadcrumbs },
          { 'co-m-nav-title--row': navTitleAsRow },
          className,
        )}
        style={style}
      >
        {showHeading && (
          <PrimaryHeading
            className={classNames({
              'co-m-pane__heading--logo': props.icon,
              'pf-v6-u-flex-grow-1': !showActions,
            })}
            alignItemsBaseline={!!link}
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
            {link && <div className="co-m-pane__heading-link">{link}</div>}
            {(isAdminPerspective || showActions) && (
              <ActionList className="co-actions" data-test-id="details-actions">
                <ActionListGroup>
                  {isAdminPerspective && !hideFavoriteButton && (
                    <ActionListItem>
                      <FavoriteButton />
                    </ActionListItem>
                  )}

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
                                : menuActions.map((a) =>
                                    a(kindObj, data, extraResources, customData),
                                  )
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
            )}
          </PrimaryHeading>
        )}
        {helpText &&
          !children &&
          (React.isValidElement(helpText) ? (
            <>{helpText}</>
          ) : (
            <Content
              component={ContentVariants.p}
              className={classNames({ 'pf-v6-u-mt-sm': title })}
            >
              {helpText}
            </Content>
          ))}
        {children}
      </NavTitle>
      {helpText && children && <PageSection className="pf-v6-u-pt-0">{helpText}</PageSection>}
    </>
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
  breadcrumbs?: { name: string; path: string }[];
  breadcrumbsFor?: (obj: K8sResourceKind) => { name: string; path: string }[];
  buttonActions?: any[];
  children?: React.ReactChildren;
  kind?: K8sResourceKindReference;
  kindObj?: K8sKind;
  menuActions?: Function[] | KebabOptionsCreator; // FIXME should be "KebabAction[] |" refactor pipeline-actions.tsx, etc.
  customActionMenu?:
    | React.ReactNode
    | ((kindObj: K8sKind, obj: K8sResourceKind) => React.ReactNode); // Renders a custom action menu.
  link?: React.ReactNode;
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
  helpText?: React.ReactNode;
  hideFavoriteButton?: boolean;
  navTitleAsRow?: boolean;
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

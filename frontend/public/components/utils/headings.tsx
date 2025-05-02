import { ResourceStatus } from '@console/dynamic-plugin-sdk';
import { Status, YellowExclamationTriangleIcon } from '@console/shared';
import SecondaryHeading from '@console/shared/src/components/heading/SecondaryHeading';
import { ActionListItem, Button, Title } from '@patternfly/react-core';
import classNames from 'classnames';
import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeading, PageHeadingProps } from '@console/shared/src/components/heading/PageHeading';
import { connectToModel } from '../../kinds';
import { K8sKind, K8sResourceKind, K8sResourceKindReference } from '../../module/k8s';
import { ActionsMenu, FirehoseResult, KebabOption, ResourceIcon } from './index';
import { ManagedByOperatorLink } from './managed-by';

export const ResourceItemDeleting = () => {
  const { t } = useTranslation();
  return (
    <span className="co-resource-item__deleting">
      <YellowExclamationTriangleIcon /> {t('public~Deleting')}
    </span>
  );
};

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

/**
 * A `PageHeading` which connects to a model and displays the resource name, status, and actions.
 */
export const ConnectedPageHeading = connectToModel(
  ({
    'data-test': dataTest,
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
    ...props
  }: ConnectedPageHeadingProps) => {
    const data = _.get(obj, 'data');
    const hasData = !_.isEmpty(data);

    const hasButtonActions = !_.isEmpty(buttonActions);
    const hasMenuActions = _.isFunction(menuActions) || !_.isEmpty(menuActions);
    const showActions =
      (hasButtonActions || hasMenuActions || customActionMenu) &&
      hasData &&
      !_.get(data, 'metadata.deletionTimestamp');

    const resourceTitle = titleFunc && data ? titleFunc(data) : title;
    const resourceStatus = hasData && getResourceStatus ? getResourceStatus(data) : null;
    const extraResources = _.reduce(
      props.resourceKeys,
      (extraObjs, key) => ({ ...extraObjs, [key]: _.get(props[key], 'data') }),
      {},
    );

    return (
      <PageHeading
        badge={badge}
        className={className}
        data-test={dataTest}
        helpAlert={helpAlert}
        helpText={helpText}
        hideFavoriteButton={hideFavoriteButton}
        icon={icon}
        linkProps={linkProps}
        breadcrumbs={breadcrumbs || (!_.isEmpty(data) ? breadcrumbsFor(data) : null)}
        title={
          OverrideTitle ? (
            <OverrideTitle obj={data} />
          ) : (
            (kind || resourceTitle || resourceStatus) && (
              <div className="co-m-pane__heading co-resource-item">
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
          showActions && (
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
          )
        }
      />
    );
  },
);

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

export type KebabOptionsCreator = (
  kindObj: K8sKind,
  data: K8sResourceKind,
  extraResources?: { [prop: string]: K8sResourceKind | K8sResourceKind[] },
  customData?: any,
) => KebabOption[];

export type ConnectedPageHeadingProps = Omit<PageHeadingProps, 'primaryAction'> & {
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
  /** A function to get the title of the resource that is used when `data` is present */
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

ConnectedPageHeading.displayName = 'ConnectedPageHeading';
SectionHeading.displayName = 'SectionHeading';
SidebarSectionHeading.displayName = 'SidebarSectionHeading';

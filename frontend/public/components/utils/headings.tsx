import type { FC, ReactNode, ComponentType } from 'react';
import { useCallback } from 'react';
import { Title } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { ResourceActionProvider } from '@console/dynamic-plugin-sdk';
import {
  isResourceActionProvider,
  ResourceStatus,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import type { WatchK8sResultsObject } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import type { PageHeadingProps } from '@console/shared/src/components/heading/PageHeading';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import SecondaryHeading from '@console/shared/src/components/heading/SecondaryHeading';
import { Status } from '@console/shared/src/components/status/Status';
import { connectToModel } from '../../kinds';
import type {
  ExtensionK8sGroupModel,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
} from '../../module/k8s';
import { referenceForExtensionModel, referenceForModel } from '../../module/k8s';
import { ManagedByOperatorLink } from './managed-by';
import { ResourceIcon } from './resource-icon';

/**
 * A `PageHeading` which connects to a model and displays the resource name, status, and actions.
 */
export const ConnectedPageHeading = connectToModel(
  ({
    'data-test': dataTest,
    badge,
    breadcrumbs,
    breadcrumbsFor,
    className,
    customActionMenu,
    getResourceStatus = (resource: K8sResourceKind): string =>
      _.get(resource, ['status', 'phase'], null),
    helpAlert,
    helpText,
    hideActions,
    hideFavoriteButton,
    icon,
    kind,
    kindObj,
    linkProps,
    obj,
    OverrideTitle,
    title,
    titleFunc,
    ...props
  }: ConnectedPageHeadingProps) => {
    const { t } = useTranslation('public');

    const data = _.get(obj, 'data');
    const hasData = !_.isEmpty(data);

    // Callers may pass either a bare kind or a group~version~Kind reference, while extension
    // models always resolve to a reference, so match on the connected model and fall back to the
    // raw value only while API discovery is in flight.
    const modelReference = kindObj ? referenceForModel(kindObj) : kind;

    const resourceProviderGuard = useCallback(
      (e): e is ResourceActionProvider =>
        isResourceActionProvider(e) &&
        referenceForExtensionModel(e.properties.model as ExtensionK8sGroupModel) === modelReference,
      [modelReference],
    );

    const [resourceProviderExtensions, resourceProviderExtensionsResolved] =
      useResolvedExtensions<ResourceActionProvider>(resourceProviderGuard);

    const hasExtensionActions =
      resourceProviderExtensionsResolved && resourceProviderExtensions?.length > 0;

    const showActions =
      !hideActions &&
      (customActionMenu || hasExtensionActions) &&
      hasData &&
      !_.get(data, 'metadata.deletionTimestamp');

    const resourceTitle = titleFunc && data ? titleFunc(data) : title;
    const resourceStatus = hasData && getResourceStatus ? getResourceStatus(data) : null;
    const extraResources = _.reduce(
      props.resourceKeys,
      (extraObjs, key) => ({ ...extraObjs, [key]: _.get(props[key], 'data') }),
      {},
    );

    const actions =
      hasExtensionActions && !customActionMenu ? (
        <LazyActionMenu
          context={{ [modelReference]: data }}
          variant={ActionMenuVariant.DROPDOWN}
          label={t('Actions')}
        />
      ) : (
        <>
          {hasData &&
            (_.isFunction(customActionMenu)
              ? customActionMenu(kindObj, data, extraResources)
              : customActionMenu)}
        </>
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
                <span
                  data-test-id="resource-title"
                  data-test="resource-title"
                  className="co-resource-item__resource-name"
                >
                  {resourceTitle}
                  {data?.metadata?.namespace && data?.metadata?.ownerReferences?.length && (
                    <ManagedByOperatorLink obj={data} />
                  )}
                </span>
                {resourceStatus && (
                  <ResourceStatus additionalClassNames="pf-v6-u-display-none pf-v6-u-display-block-on-sm">
                    <Status status={resourceStatus} />
                  </ResourceStatus>
                )}
              </div>
            )
          )
        }
        primaryAction={showActions ? actions : undefined}
      />
    );
  },
);

export const SectionHeading: FC<SectionHeadingProps> = ({
  text,
  children,
  style,
  required,
  id,
}) => (
  <SecondaryHeading
    style={style}
    data-test={`section-heading-${text}`}
    data-test-section-heading={text}
    id={id}
  >
    <span
      className={css({
        'co-required': required,
      })}
    >
      {text}
    </span>
    {children}
  </SecondaryHeading>
);

export const SidebarSectionHeading: FC<SidebarSectionHeadingProps> = ({
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

export type ConnectedPageHeadingProps = Omit<PageHeadingProps, 'primaryAction'> & {
  breadcrumbsFor?: (obj: K8sResourceKind) => { name: string; path: string }[];
  /** Renders a custom action menu if the `obj` prop is passed with `data` */
  customActionMenu?:
    | ReactNode
    | ((
        kindObj: K8sKind,
        obj: K8sResourceKind,
        extraResources?: { [prop: string]: K8sResourceKind | K8sResourceKind[] },
      ) => ReactNode);
  getResourceStatus?: (resource: K8sResourceKind) => string;
  /** Suppresses the resource action menu, for headings that name a resource but are not its
   * details page. */
  hideActions?: boolean;
  kind?: K8sResourceKindReference;
  kindObj?: K8sKind;
  obj?: WatchK8sResultsObject<K8sResourceKind>;
  /** A component to override the title of the page */
  OverrideTitle?: ComponentType<{ obj?: K8sResourceKind }>;
  resourceKeys?: string[];
  /** A function to get the title of the resource that is used when `data` is present */
  titleFunc?: (obj: K8sResourceKind) => string | ReactNode;
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

import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { Link } from 'react-router-dom';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '@console/internal/redux';
import {
  OverviewItem,
  HealthChecksAlert,
  YellowExclamationTriangleIcon,
  useCsvWatchResource,
} from '@console/shared';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { ActionsMenu, KebabAction, ResourceIcon, resourcePath } from './index';
import { K8sKind, referenceForModel } from '../../module/k8s';
import { PageHeading as PageHeadingCommon } from '@console/dynamic-plugin-sdk/src/app/components/utils/headings';
import { ManagedByOperatorLink } from './managed-by';

export {
  BreadCrumbs,
  ActionButtons,
} from '@console/dynamic-plugin-sdk/src/app/components/utils/headings';

export const PageHeading = (props) => {
  const data = _.get(props.obj, 'data');
  const managedByComponent =
    data?.metadata?.namespace && data?.metadata?.ownerReferences?.length ? (
      <ManagedByOperatorLink obj={data} />
    ) : null;
  return <PageHeadingCommon {...props} managedByComponent={managedByComponent} />;
};

export const ResourceItemDeleting = () => {
  const { t } = useTranslation();
  return (
    <span className="co-resource-item__deleting">
      <YellowExclamationTriangleIcon /> {t('public~Deleting')}
    </span>
  );
};

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
  const ns = useSelector((state: RootState) => getActiveNamespace(state));
  const { csvData } = useCsvWatchResource(ns);
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
            <ActionsMenu
              actions={actions.map((a) => a(kindObj, resource, otherResources, { csvs: csvData }))}
            />
          </div>
        )}
      </h1>
      <HealthChecksAlert resource={resource} />
    </div>
  );
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

ResourceOverviewHeading.displayName = 'ResourceOverviewHeading';
SectionHeading.displayName = 'SectionHeading';
SidebarSectionHeading.displayName = 'SidebarSectionHeading';

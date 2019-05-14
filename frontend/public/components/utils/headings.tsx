import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';

import { ActionsMenu, ResourceIcon, KebabAction, resourcePath } from './index';
import { ClusterServiceVersionLogo } from '../operator-lifecycle-manager';
import { connectToModel } from '../../kinds';
import { ClusterServiceVersionModel } from '../../models';
import {
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  referenceForModel,
} from '../../module/k8s';
import { ResourceItemDeleting } from '../overview/project-overview';

export const BreadCrumbs: React.SFC<BreadCrumbsProps> = ({breadcrumbs}) => (
  <ol className="breadcrumb">
    { breadcrumbs.map((crumb, i, {length}) => {
      const isLast = i === length - 1;

      return <li key={i} className={classNames({'active': isLast})}>
        {isLast ? (
          crumb.name
        ) : (
          <Link className="breadcrumb-link" to={crumb.path}>{crumb.name}</Link>
        )}
      </li>;
    }) }
  </ol>);

const ActionButtons: React.SFC<ActionButtonsProps> = ({actionButtons}) => <div className="co-action-buttons">
  {_.map(actionButtons, (actionButton, i) => {
    if (!_.isEmpty(actionButton)) {
      return <button className={`btn ${actionButton.btnClass} co-action-buttons__btn`} onClick={actionButton.callback} key={i}>{actionButton.label}</button>;
    }
  })}
</div>;

export const PageHeading = connectToModel((props: PageHeadingProps) => {
  const {kind, kindObj, detail, title, menuActions, buttonActions, obj, breadcrumbsFor, titleFunc, style} = props;
  const data = _.get(obj, 'data');
  const resourceTitle = (titleFunc && data) ? titleFunc(data) : title;
  const isCSV = kind === referenceForModel(ClusterServiceVersionModel);
  const csvLogo = () => !_.isEmpty(data)
    ? <ClusterServiceVersionLogo icon={_.get(data, 'spec.icon', [])[0]} displayName={data.spec.displayName} version={data.spec.version} provider={data.spec.provider} />
    : <div style={{height: '60px'}} />;

  const logo = isCSV
    ? csvLogo()
    : <div className="co-m-pane__name co-resource-item">{ kind && <ResourceIcon kind={kind} className="co-m-resource-icon--lg" /> } <span id="resource-title" className="co-resource-item__resource-name">{resourceTitle}</span></div>;
  const hasButtonActions = !_.isEmpty(buttonActions);
  const hasMenuActions = !_.isEmpty(menuActions);
  const showActions = (hasButtonActions || hasMenuActions) && !_.isEmpty(data) && !_.get(data, 'deletionTimestamp');

  return <div className={classNames('co-m-nav-title', {'co-m-nav-title--detail': detail}, {'co-m-nav-title--logo': isCSV}, {'co-m-nav-title--breadcrumbs': breadcrumbsFor && !_.isEmpty(data)})} style={style}>
    { breadcrumbsFor && !_.isEmpty(data) && <BreadCrumbs breadcrumbs={breadcrumbsFor(data)} /> }
    <h1 className={classNames('co-m-pane__heading', {'co-m-pane__heading--logo': isCSV})}>
      { logo }
      { showActions && <div className="co-actions">
        { hasButtonActions && <ActionButtons actionButtons={buttonActions.map(a => a(kindObj, data))} /> }
        { hasMenuActions && <ActionsMenu actions={menuActions.map(a => a(kindObj, data))} /> }
      </div> }
    </h1>
    {props.children}
  </div>;
});

export const SectionHeading: React.SFC<SectionHeadingProps> = ({text, children, style}) => <h2 className="co-section-heading" style={style}>{text}{children}</h2>;

export const SidebarSectionHeading: React.SFC<SidebarSectionHeadingProps> = ({text, children, style}) => <h2 className="sidebar__section-heading" style={style}>{text}{children}</h2>;

export const ResourceOverviewHeading: React.SFC<ResourceOverviewHeadingProps> = ({kindObj, actions, resource}) => {
  const isDeleting = !!resource.metadata.deletionTimestamp;
  return <div className="overview__sidebar-pane-head resource-overview__heading">
    <h1 className="co-m-pane__heading">
      <div className="co-m-pane__name co-resource-item">
        <ResourceIcon className="co-m-resource-icon--lg" kind={kindObj.kind} />
        <Link to={resourcePath(resource.kind, resource.metadata.name, resource.metadata.namespace)} className="co-resource-item__resource-name">
          {resource.metadata.name}
        </Link>
        {isDeleting && <ResourceItemDeleting />}
      </div>
      {!isDeleting && <div className="co-actions">
        <ActionsMenu actions={actions.map(a => a(kindObj, resource))} />
      </div>}
    </h1>
  </div>;
};

export type ActionButtonsProps = {
  actionButtons: any[];
};

export type BreadCrumbsProps = {
  breadcrumbs: {name: string, path: string}[];
};

export type PageHeadingProps = {
  breadcrumbsFor?: (obj: K8sResourceKind) => {name: string, path: string}[];
  buttonActions?: any[];
  children?: React.ReactChildren;
  detail?: boolean;
  kind?: K8sResourceKindReference;
  kindObj?: K8sKind;
  menuActions?: any[];
  obj?: {data: K8sResourceKind};
  style?: object;
  title?: string | JSX.Element;
  titleFunc?: (obj: K8sResourceKind) => string | JSX.Element;
};

export type ResourceOverviewHeadingProps = {
  actions: KebabAction[];
  kindObj: K8sKind;
  resource: K8sResourceKind;
};

export type SectionHeadingProps = {
  children?: any;
  style?: any;
  text: string;
};

export type SidebarSectionHeadingProps = {
  children?: any;
  style?: any;
  text: string;
};

BreadCrumbs.displayName = 'BreadCrumbs';
PageHeading.displayName = 'PageHeading';
ResourceOverviewHeading.displayName = 'ResourceOverviewHeading';
SectionHeading.displayName = 'SectionHeading';
SidebarSectionHeading.displayName = 'SidebarSectionHeading';

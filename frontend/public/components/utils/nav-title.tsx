import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';

import { ActionsMenu, ResourceIcon, CogAction } from './index';
import { ClusterServiceVersionLogo } from '../operator-lifecycle-manager';
import { K8sResourceKind, K8sResourceKindReference, K8sKind, referenceForModel } from '../../module/k8s';
import { connectToModel } from '../../kinds';
import { ClusterServiceVersionModel } from '../../models';

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

export const NavTitle = connectToModel((props: NavTitleProps) => {
  const {kind, kindObj, detail, title, menuActions, buttonActions, obj, breadcrumbsFor, titleFunc, style} = props;
  const data = _.get(obj, 'data');
  const resourceTitle = (titleFunc && data) ? titleFunc(data) : title;
  const isCSV = kind === referenceForModel(ClusterServiceVersionModel);
  const csvLogo = () => !_.isEmpty(data)
    ? <ClusterServiceVersionLogo icon={_.get(data, 'spec.icon', [])[0]} displayName={data.spec.displayName} version={data.spec.version} provider={data.spec.provider} />
    : <div style={{height: '60px'}} />;

  const logo = isCSV
    ? csvLogo()
    : <div className="co-m-pane__name">{ kind && <ResourceIcon kind={kind} className="co-m-resource-icon--lg pull-left" /> } <span id="resource-title">{resourceTitle}</span></div>;
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

/* eslint-disable no-undef */
export type NavTitleProps = {
  kind?: K8sResourceKindReference;
  kindObj?: K8sKind;
  detail?: boolean;
  title?: string | JSX.Element;
  menuActions?: CogAction[];
  buttonActions?: any[];
  obj?: {data: K8sResourceKind};
  breadcrumbsFor?: (obj: K8sResourceKind) => {name: string, path: string}[];
  titleFunc?: (obj: K8sResourceKind) => string | JSX.Element;
  children?: React.ReactChildren;
  style?: object;
};

export type BreadCrumbsProps = {
  breadcrumbs: {name: string, path: string}[];
};

export type ActionButtonsProps = {
  actionButtons: any[];
};
/* eslint-enable no-undef */

NavTitle.displayName = 'NavTitle';
BreadCrumbs.displayName = 'BreadCrumbs';

/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from'classnames';
import * as _ from 'lodash';

import { ActionsMenu, kindObj, ResourceIcon } from './index';
import { ClusterServiceVersionLogo, K8sResourceKind } from '../cloud-services';

export const BreadCrumbs: React.StatelessComponent<BreadCrumbsProps> = ({breadcrumbs}) => (
  <div className="co-m-nav-title__breadcrumbs">
    { breadcrumbs.map((crumb, i, {length}) => {
      const isLast = i === length - 1;

      return <div key={i}>
        <Link className={classNames('co-m-nav-title__breadcrumbs__link', {'co-m-nav-title__breadcrumbs__link--end': isLast})} to={crumb.path}>{crumb.name}</Link>
        { !isLast && <span className="co-m-nav-title__breadcrumbs__seperator">/</span> }
      </div>;
    }) }
  </div>);

export const NavTitle: React.StatelessComponent<NavTitleProps> = ({kind, detail, title, menuActions, obj, breadcrumbs, children}) => {
  const data = _.get<K8sResourceKind>(obj, 'data');
  const hasLogo = !_.isEmpty(data) && _.has(data, 'spec.icon');
  const logo = hasLogo
    ? <ClusterServiceVersionLogo icon={_.get(data, 'spec.icon', [])[0]} displayName={data.spec.displayName} version={data.spec.version} provider={data.spec.provider} />
    : <div>{ kind && <ResourceIcon kind={kind} className="co-m-page-title__icon" /> } <span>{title}</span></div>;

  return <div className={classNames('row', detail ? 'co-m-nav-title__detail' : 'co-m-nav-title')}>
    <div className="col-xs-12">
      { breadcrumbs && <BreadCrumbs breadcrumbs={breadcrumbs} />}
      <h1 className={classNames('co-m-page-title', {'co-m-page-title--detail': detail}, {'co-m-page-title--logo': hasLogo}, {'co-m-page-title--breadcrumbs': breadcrumbs})}>
        {logo}
        { menuActions && !_.isEmpty(data) && !_.get(data.metadata, 'deletionTimestamp') && <ActionsMenu actions={menuActions.map(a => a(kindObj(kind), data))} /> }
      </h1>
      {children}
    </div>
  </div>;
};

export type NavTitleProps = {
  kind?: string;
  detail?: boolean;
  title?: string | JSX.Element;
  menuActions?: any[];
  obj?: {data: K8sResourceKind};
  breadcrumbs?: {name: string, path: string}[];
};

export type BreadCrumbsProps = {
  breadcrumbs: {name: string, path: string}[];
};

NavTitle.displayName = 'NavTitle';
BreadCrumbs.displayName = 'BreadCrumbs';

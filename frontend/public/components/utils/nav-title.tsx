import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from'classnames';
import * as _ from 'lodash-es';

import { ActionsMenu, ResourceIcon } from './index';
import { ClusterServiceVersionLogo } from '../cloud-services';
import { K8sResourceKind, K8sResourceKindReference, K8sKind, referenceFor, referenceForModel } from '../../module/k8s';
import { connectToModel } from '../../kinds';
import { ClusterServiceVersionModel } from '../../models';

export const BreadCrumbs: React.SFC<BreadCrumbsProps> = ({breadcrumbs}) => (
  <div className="co-m-nav-title__breadcrumbs">
    { breadcrumbs.map((crumb, i, {length}) => {
      const isLast = i === length - 1;

      return <div key={i}>
        <Link className={classNames('co-m-nav-title__breadcrumbs__link', {'co-m-nav-title__breadcrumbs__link--end': isLast})} to={crumb.path}>{crumb.name}</Link>
        { !isLast && <span className="co-m-nav-title__breadcrumbs__seperator">/</span> }
      </div>;
    }) }
  </div>);

export const NavTitle = connectToModel((props: NavTitleProps) => {
  const {kind, kindObj, detail, title, menuActions, obj, breadcrumbs, style} = props;
  const data = _.get(obj, 'data');
  const isCSV = !_.isEmpty(data) && referenceFor(data) === referenceForModel(ClusterServiceVersionModel);
  const logo = isCSV
    ? <ClusterServiceVersionLogo icon={_.get(data, 'spec.icon', [])[0]} displayName={data.spec.displayName} version={data.spec.version} provider={data.spec.provider} />
    : <div>{ kind && <ResourceIcon kind={kind} className="co-m-page-title__icon" /> } <span id="resource-title">{title}</span></div>;

  return <div className={classNames('row', detail ? 'co-m-nav-title__detail' : 'co-m-nav-title')} style={style}>
    <div className="col-xs-12">
      { breadcrumbs && <BreadCrumbs breadcrumbs={breadcrumbs} />}
      <h1 className={classNames('co-m-page-title', {'co-m-page-title--detail': detail}, {'co-m-page-title--logo': isCSV}, {'co-m-page-title--breadcrumbs': breadcrumbs})}>
        {logo}
        { menuActions && !_.isEmpty(data) && !_.get(data.metadata, 'deletionTimestamp') && <ActionsMenu actions={menuActions.map(a => a(kindObj, data))} /> }
      </h1>
      {props.children}
    </div>
  </div>;
});

/* eslint-disable no-undef */
export type NavTitleProps = {
  kind?: K8sResourceKindReference;
  kindObj?: K8sKind;
  detail?: boolean;
  title?: string | JSX.Element;
  menuActions?: any[];
  obj?: {data: K8sResourceKind};
  breadcrumbs?: {name: string, path: string}[];
  children?: React.ReactChildren;
  style?: object;
};

export type BreadCrumbsProps = {
  breadcrumbs: {name: string, path: string}[];
};
/* eslint-enable no-undef */

NavTitle.displayName = 'NavTitle';
BreadCrumbs.displayName = 'BreadCrumbs';

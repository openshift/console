import React from 'react';
import Helmet from 'react-helmet';

import {makeList, TwoColumns} from '../factory';
import {RowOfKind, RoleHeader, RoleDetails} from './role';
import {NavTitle} from '../utils';

const Roles = makeList('clusterrole', RoleHeader, RowOfKind('clusterrole'));

const Details = (selected) => {
  if (!_.isEmpty(selected)) {
    return <RoleDetails {...selected} />;
  }
  return <div className="empty-page">
    <h1 className="empty-page__header">No Cluster Role selected</h1>
    <p className="empty-page__explanation">
      Cluster Roles grant access to types of objects in any namespace in the cluster.  Cluster Roles are applied to a group or user via a Cluster Role Binding.
    </p>
  </div>;
};

export const ClusterRolesPage = () => <div>
  <Helmet title="Cluster Roles" />
  <NavTitle title="Cluster Roles" />
  <TwoColumns list={Roles}>
    <Details />
  </TwoColumns>
</div>;

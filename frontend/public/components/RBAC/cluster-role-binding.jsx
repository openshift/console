import React from 'react';

import {ResourceIcon} from '../utils';
import {BindingDetails} from './role-binding';
import {register} from '../react-wrapper';
import {makeList, TwoColumns} from '../factory';

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-6">Name</div>
  <div className="col-xs-6">Role</div>
</div>;

const Row = (roleBinding) => {
  const {metadata, roleRef} = roleBinding;

  return (
    <TwoColumns.RowWrapper {...roleBinding}>
      <div className="col-xs-6">
        <ResourceIcon kind="rolebinding" /> {metadata.name}
      </div>
      <div className="col-xs-6">
        <ResourceIcon kind={roleRef.kind.toLowerCase()} />{roleRef.name}
      </div>
    </TwoColumns.RowWrapper>
  );
};

export const ClusterRoleBindings = makeList('ClusterRoleBindings', 'CLUSTERROLEBINDING', Header, Row);

const RBDetails = BindingDetails('Cluster Role Binding Overview');

const Details = (selected) => {
  if (!_.isEmpty(selected)) {
    return <RBDetails {...selected} />;
  }
  return <div className="empty-page">
    <h1 className="empty-page__header">No Cluster Role Binding selected</h1>
    <p className="empty-page__explanation">
    </p>
  </div>;
};

const RoleBindingsPage = (props) => <TwoColumns list={ClusterRoleBindings} {...props}>
  <Details />
</TwoColumns>;

register('ClusterRoleBindingsPage', RoleBindingsPage);

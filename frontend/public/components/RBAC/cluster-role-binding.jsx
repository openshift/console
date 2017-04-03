import React from 'react';
import Helmet from 'react-helmet';

import {ResourceIcon, NavTitle} from '../utils';
import {BindingDetails} from './role-binding';
import {makeList, TwoColumns} from '../factory';

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-6">Name</div>
  <div className="col-xs-6">Role</div>
</div>;

const Row = (props) => {
  const {metadata, roleRef} = props.obj;

  return (
    <TwoColumns.RowWrapper {...props}>
      <div className="col-xs-6">
        <ResourceIcon kind="rolebinding" /> {metadata.name}
      </div>
      <div className="col-xs-6">
        <ResourceIcon kind={roleRef.kind.toLowerCase()} />{roleRef.name}
      </div>
    </TwoColumns.RowWrapper>
  );
};

const ClusterRoleBindings = makeList('clusterrolebinding', Header, Row);

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

export const ClusterRoleBindingsPage = (props) => <div>
  <Helmet title="Cluster Role Bindings" />
  <NavTitle title="Cluster Role Bindings" />
  <TwoColumns list={ClusterRoleBindings} {...props}>
    <Details />
  </TwoColumns>
</div>;

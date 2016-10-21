import React from 'react';

import {register} from '../react-wrapper';
import {Rules} from './rules';

import {makeList, TwoColumns} from '../factory';
import {Timestamp, ResourceIcon} from '../utils';


export const RoleHeader = () => <div className="co-m-facet-menu__title">Name</div>;

export const RowOfKind = (kind) => (role) => {
  return <TwoColumns.RowWrapper {...role}>
    <div className="col-xs-12">
      <ResourceIcon kind={kind} /> {role.metadata.name}
    </div>
  </TwoColumns.RowWrapper>;
};

export const Roles = makeList('Roles', 'ROLE', RoleHeader, RowOfKind('role'));

export const RoleDetails = ({rules, metadata}) => <div className="details-page">
  <h1 className="co-m-pane__title co-m-pane__body__top-controls">
    {metadata.name}
  </h1>
  <dl>
    <dt>Created At</dt>
    <dd><Timestamp timestamp={metadata.creationTimestamp} /></dd>
  </dl>
  <Rules rules={rules} />
</div>;

const Details = (selected) => {
  if (!_.isEmpty(selected)) {
    return <RoleDetails {...selected} />;
  }
  return <div className="empty-page">
    <h1 className="empty-page__header">No Role selected</h1>
    <p className="empty-page__explanation">
      Roles grant access to types of objects in the cluster.  Roles are applied to a team or user within a namespace via a Role Binding.
    </p>
  </div>;
};

const RolesPage = (props) => <TwoColumns list={Roles} {...props}>
  <Details />
</TwoColumns>;

register('RolesPage', RolesPage);

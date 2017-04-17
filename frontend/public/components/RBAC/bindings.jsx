import React from 'react';

import { MultiListPage, MultiList } from '../factory';
import { MsgBox, ResourceLink } from '../utils';

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-3">Role Ref</div>
  <div className="col-xs-2">Subject Kind</div>
  <div className="col-xs-4">Subject Name</div>
  <div className="col-xs-3">Namespace</div>
</div>;

export const RoleLink = ({binding}) => {
  const kind = binding.roleRef.kind.toLowerCase();

  // Cluster Roles have no namespace and for Roles, the Role's namespace matches the Role Binding's namespace
  const ns = kind === 'clusterrole' ? undefined : binding.metadata.namespace;
  return <ResourceLink kind={kind} name={binding.roleRef.name} namespace={ns} />;
};

const Row = ({obj: binding}) => <div>
  {_.map(binding.subjects, (subject, i) => <div className="row co-resource-list__item" key={i}>
    <div className="col-xs-3">
      <RoleLink binding={binding} />
    </div>
    <div className="col-xs-2">
      {subject.kind}
    </div>
    <div className="col-xs-4">
      {subject.name}
    </div>
    <div className="col-xs-3">
      {binding.metadata.namespace ? <ResourceLink kind="namespace" name={binding.metadata.namespace} /> : 'all'}
    </div>
  </div>)}
</div>;

const EmptyBox = <MsgBox title="No Role Bindings Found" detail="Roles grant access to types of objects in the cluster. Roles are applied to a group or user via a Role Binding" />;

const List = props => <MultiList {...props} EmptyBox={EmptyBox} Header={Header} Row={Row} />;

const filters = [{
  type: 'role-kind',
  selected: [0, 1],
  reducer: binding => _.get(binding, 'roleRef.kind'),
  items: [
    ['Cluster-wide Role Bindings', 'ClusterRole'],
    ['Namespace Role Bindings', 'Role'],
  ],
}];

// Split each binding into one row per subject
const rowSplitter = binding => binding && _.map(binding.subjects, subject => Object.assign({}, binding, {subject}));

export const BindingsPage = () => <MultiListPage
  ListComponent={List}
  kinds={['rolebinding', 'clusterrolebinding']}
  filterLabel="Role Bindings by role or subject"
  rowFilters={filters}
  rowSplitter={rowSplitter}
  textFilter="role-binding"
  title="Role Bindings"
/>;

import React from 'react';
import { Link } from 'react-router';

import { MultiListPage, MultiList } from '../factory';
import { MsgBox, ResourceIcon, ResourceLink } from '../utils';

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-3">Role Ref</div>
  <div className="col-xs-2">Subject Kind</div>
  <div className="col-xs-4">Subject Name</div>
  <div className="col-xs-3">Namespace</div>
</div>;

const Row = ({obj: binding}) => <div>
  {_.map(binding.subjects, (subject, i) => <div className="row co-resource-list__item" key={i}>
    <div className="col-xs-3">
      {/* TODO(andy): Link to old role details pages until the new ones are implemented */}
      <span className="co-resource-link">
        <ResourceIcon kind={binding.roleRef.kind.toLowerCase()} />
        <Link to={binding.roleRef.kind === 'Role' ? `all-namespaces/roles#(${binding.metadata.namespace})-${binding.roleRef.name}` : `clusterroles#${binding.roleRef.name}`}>{binding.roleRef.name}</Link>
      </span>
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

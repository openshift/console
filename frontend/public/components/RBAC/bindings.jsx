import React from 'react';

import { k8s, k8sEnum } from '../../module/k8s';
import { MultiListPage, MultiList } from '../factory';
import { confirmModal } from '../modals';
import { Cog, MsgBox, ResourceCog, ResourceIcon, ResourceLink } from '../utils';

const bindingKind = binding => binding.metadata.namespace ? 'rolebinding' : 'clusterrolebinding';

// Split each binding into one row per subject
const rowSplitter = binding => {
  if (!binding) {
    return undefined;
  }
  if (_.isEmpty(binding.subjects)) {
    const subject = {kind: '-', name: '-'};
    return [Object.assign({}, binding, {subject})];
  }
  return binding.subjects.map(subject => Object.assign({}, binding, {subject}));
};

const DeleteSubject = (i) => (kind, binding) => {
  const subject = binding.subjects[i];
  return {
    label: `Delete ${kind.label} Subject...`,
    weight: 900,
    callback: () => confirmModal({
      title: `Delete ${kind.label} Subject`,
      message: `Are you sure you want to delete subject ${subject.name} of type ${subject.kind}?`,
      btnText: 'Delete Subject',
      executeFn: () => k8s[kind.plural].patch(binding, [{op: 'remove', path: `/subjects/${i}`}]),
    }),
  };
};

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-3">Name</div>
  <div className="col-xs-3">Role Ref</div>
  <div className="col-xs-6">
    <div className="col-xs-3">Subject Kind</div>
    <div className="col-xs-5">Subject Name</div>
    <div className="col-xs-4">Namespace</div>
  </div>
</div>;

export const BindingName = ({actions, binding}) => <span>
  <ResourceCog actions={actions} kind={bindingKind(binding)} resource={binding} />
  <ResourceIcon kind={bindingKind(binding)} /> {binding.metadata.name}
</span>;

export const RoleLink = ({binding}) => {
  const kind = binding.roleRef.kind.toLowerCase();

  // Cluster Roles have no namespace and for Roles, the Role's namespace matches the Role Binding's namespace
  const ns = kind === 'clusterrole' ? undefined : binding.metadata.namespace;
  return <ResourceLink kind={kind} name={binding.roleRef.name} namespace={ns} />;
};

const SubjectRow = ({actions, binding, kind, name}) => {
  return <div className="row co-resource-list__item">
    <div className="col-xs-3">
      <BindingName actions={actions} binding={binding} />
    </div>
    <div className="col-xs-3">
      <RoleLink binding={binding} />
    </div>
    <div className="col-xs-6">
      <div className="col-xs-3">
        {kind}
      </div>
      <div className="col-xs-5">
        {name}
      </div>
      <div className="col-xs-4">
        {binding.metadata.namespace ? <ResourceLink kind="namespace" name={binding.metadata.namespace} /> : 'all'}
      </div>
    </div>
  </div>;
};

export const BindingRows = Row => ({obj: binding}) => {
  const rows = rowSplitter(binding);
  return <div>
    {rows.map(({subject}, i) => <Row
      key={i}
      actions={[rows.length === 1 ? Cog.factory.Delete : DeleteSubject(i)]}
      binding={binding}
      kind={subject.kind}
      name={subject.name}
    />)}
  </div>;
};

export const EmptyMsg = <MsgBox title="No Role Bindings Found" detail="Roles grant access to types of objects in the cluster. Roles are applied to a group or user via a Role Binding." />;

const List = props => <MultiList {...props} EmptyMsg={EmptyMsg} Header={Header} Row={BindingRows(SubjectRow)} />;

export const bindingType = binding => {
  if (!binding) {
    return undefined;
  }
  if (binding.roleRef.name.startsWith('system:')) {
    return 'system';
  }
  return binding.metadata.namespace ? 'namespace' : 'cluster';
};

const filters = [{
  type: 'role-binding-kind',
  selected: ['cluster', 'namespace'],
  reducer: bindingType,
  items: ({clusterrolebinding: data}) => {
    const items = [
      {id: 'namespace', title: 'Namespace Role Bindings'},
      {id: 'system', title: 'System Role Bindings'},
    ];
    if (data && data.loaded && !data.loadError) {
      items.unshift({id: 'cluster', title: 'Cluster-wide Role Bindings'});
    }
    return items;
  },
}];

const resources = [
  {kind: 'rolebinding', namespaced: true},
  {kind: 'clusterrolebinding', namespaced: false},
];

export const RoleBindingsPage = ({namespace}) => <MultiListPage
  ListComponent={List}
  canCreate={true}
  createButtonText="Create Binding"
  createProps={{to: `ns/${namespace || k8sEnum.DefaultNS}/rolebindings/new`}}
  filterLabel="Role Bindings by role or subject"
  resources={resources}
  rowFilters={filters}
  rowSplitter={rowSplitter}
  textFilter="role-binding"
  title="Role Bindings"
/>;

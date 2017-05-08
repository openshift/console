import React from 'react';
import Helmet from 'react-helmet';
import { Link } from 'react-router';

import { k8sEnum } from '../../module/k8s';
import { DetailsPage, MultiList, MultiListPage } from '../factory';
import { Cog, Firehose, Heading, MsgBox, NavBar, navFactory, NavTitle, ResourceCog, ResourceLink, Timestamp } from '../utils';
import { BindingName, BindingRows, EmptyMsg as BindingsEmptyMsg, RulesList } from './index';

const addHref = (name, ns) => ns ? `ns/${ns}/roles/${name}/add-rule` : `clusterroles/${name}/add-rule`;

const roleKind = role => role.metadata.namespace ? 'role' : 'clusterrole';

const menuActions = [
  (kind, role) => ({
    label: 'Add Rule...',
    weight: 100,
    href: addHref(role.metadata.name, role.metadata.namespace),
  }),
  Cog.factory.Edit,
  Cog.factory.Delete,
];

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-6">Name</div>
  <div className="col-xs-6">Namespace</div>
</div>;

const Row = ({obj: role}) => <div className="row co-resource-list__item">
  <div className="col-xs-6">
    <ResourceCog actions={menuActions} kind={roleKind(role)} resource={role} />
    <ResourceLink kind={roleKind(role)} name={role.metadata.name} namespace={role.metadata.namespace} />
  </div>
  <div className="col-xs-6">
    {role.metadata.namespace ? <ResourceLink kind="namespace" name={role.metadata.namespace} /> : 'all'}
  </div>
</div>;

const Details = ({metadata, rules}) => <div>
  <Heading text="Role Overview" />
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-xs-6">
        <dl>
          <dt>Role Name</dt>
          <dd>{metadata.name}</dd>
          {metadata.namespace && <div>
            <dt>Namespace</dt>
            <dd><ResourceLink kind="namespace" name={metadata.namespace} /></dd>
          </div>}
        </dl>
      </div>
      <div className="col-xs-6">
        <dl>
          <dt>Created At</dt>
          <dd><Timestamp timestamp={metadata.creationTimestamp} /></dd>
        </dl>
      </div>
    </div>
  </div>
  <Heading text="Rules" />
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-xs-12">
        <Link to={addHref(metadata.name, metadata.namespace)}>
          <button className="btn btn-primary">Add Rule</button>
        </Link>
        <RulesList rules={rules} metadata={metadata} />
      </div>
    </div>
  </div>
</div>;

const pages = [navFactory.details(Details), navFactory.editYaml(), {href: 'bindings', name: 'Role Bindings'}];

const BindingHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-4">Name</div>
  <div className="col-xs-2">Subject Kind</div>
  <div className="col-xs-4">Subject Name</div>
  <div className="col-xs-2">Namespace</div>
</div>;

const SubjectRow = ({actions, binding, kind, name}) => <div className="row co-resource-list__item">
  <div className="col-xs-4">
    <BindingName binding={binding} actions={actions} />
  </div>
  <div className="col-xs-2">
    {kind}
  </div>
  <div className="col-xs-4">
    {name}
  </div>
  <div className="col-xs-2">
    {binding.namespace || 'all'}
  </div>
</div>;

const BindingsList = props => <MultiList
  {...props}
  EmptyMsg={BindingsEmptyMsg}
  Header={BindingHeader}
  Row={BindingRows(SubjectRow)}
/>;

export const BindingsForRolePage = ({params: {name, ns}, route: {kind}}) => <div>
  <Helmet title={`${name} · Bindings`} />
  <Firehose kind={kind} name={name} namespace={ns}>
    <NavTitle detail={true} kind={kind} menuActions={menuActions} title={name} />
  </Firehose>
  <NavBar pages={pages} />
  <MultiListPage
    ListComponent={BindingsList}
    staticFilters={[{'role-binding-roleRef': name}]}
    resources={[
      {kind: 'rolebinding', namespaced: true},
      {kind: 'clusterrolebinding', namespaced: false},
    ]}
    textFilter="role-binding"
    filterLabel="Role Bindings by role or subject"
  />
</div>;

export const RolesDetailsPage = props => <DetailsPage {...props} pages={pages} menuActions={menuActions} />;
export const ClusterRolesDetailsPage = RolesDetailsPage;

const EmptyMsg = <MsgBox title="No Roles Found" detail="Roles grant access to types of objects in the cluster. Roles are applied to a team or user via a Role Binding." />;

const List = props => <MultiList {...props} EmptyMsg={EmptyMsg} Header={Header} Row={Row} />;

export const roleType = role => {
  if (!role) {
    return undefined;
  }
  if (role.metadata.name.startsWith('system:')) {
    return 'system';
  }
  return role.metadata.namespace ? 'namespace' : 'cluster';
};

const filters = [{
  type: 'role-kind',
  selected: ['cluster', 'namespace'],
  reducer: roleType,
  items: [
    {id: 'cluster', title: 'Cluster-wide Roles'},
    {id: 'namespace', title: 'Namespace Roles'},
    {id: 'system', title: 'System Roles'},
  ],
}];

const resources = [
  {kind: 'role', namespaced: true},
  {kind: 'clusterrole', namespaced: false},
];

export const RolesPage = ({namespace}) => <MultiListPage
  ListComponent={List}
  canCreate={true}
  createButtonText="Create Role"
  createProps={{to: `ns/${namespace || k8sEnum.DefaultNS}/roles/new`}}
  filterLabel="Role by name"
  resources={resources}
  rowFilters={filters}
  title="Roles"
/>;

import React from 'react';
import { Link } from 'react-router';

import { k8sEnum } from '../../module/k8s';
import { DetailsPage, MultiList, MultiListPage } from '../factory';
import { Cog, Heading, MsgBox, navFactory, ResourceLink, Timestamp } from '../utils';
import { RulesList } from './index';

const addHref = (name, ns) => ns ? `ns/${ns}/roles/${name}/add-rule` : `clusterroles/${name}/add-rule`;

const menuActions = [
  (kind, role) => ({
    label: 'Add Rule...',
    weight: 100,
    href: addHref(role.metadata.name, role.metadata.namespace),
  }),

  // Same as the normal resource Edit action, but with a different label
  (kind, role) => Object.assign({}, Cog.factory.Edit(kind, role), {label: 'Add Rule with YAML Editor...'}),
];

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-6">Name</div>
  <div className="col-xs-6">Namespace</div>
</div>;

const Row = ({obj: {metadata}}) => <div className="row co-resource-list__item">
  <div className="col-xs-6">
    <ResourceLink kind={metadata.namespace ? 'role' : 'clusterrole'} name={metadata.name} namespace={metadata.namespace} />
  </div>
  <div className="col-xs-6">
    {metadata.namespace ? <ResourceLink kind="namespace" name={metadata.namespace} /> : 'all'}
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

const pages = [navFactory.details(Details), navFactory.editYaml()];

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
  selected: [0, 1],
  reducer: roleType,
  items: [
    ['Cluster-wide Roles', 'cluster'],
    ['Namespace Roles', 'namespace'],
    ['System Roles', 'system'],
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

import * as _ from 'lodash-es';
import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
// import { Link } from 'react-router-dom';
import { RoleModel } from '../../models';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { flatten as bindingsFlatten } from './bindings';
import { BindingName, BindingsList, RulesList } from './index';
import { DetailsPage, MultiListPage, TextFilter, Table, TableRow, TableData } from '../factory';
import {
  Kebab,
  SectionHeading,
  MsgBox,
  navFactory,
  ResourceKebab,
  ResourceLink,
  Timestamp,
} from '../utils';

export const isSystemRole = (role) => _.startsWith(role.metadata.name, 'system:');

// const addHref = (name, ns) => ns ? `/k8s/ns/${ns}/roles/${name}/add-rule` : `/k8s/cluster/clusterroles/${name}/add-rule`;

export const roleKind = (role) => (role.metadata.namespace ? 'Role' : 'ClusterRole');

const menuActions = [
  // This page is temporarily disabled until we update the safe resources list.
  // (kind, role) => ({
  //   label: 'Add Rule',
  //   href: addHref(role.metadata.name, role.metadata.namespace),
  // }),
  (kind, role) => ({
    label: 'Add Role Binding',
    href: `/k8s/cluster/rolebindings/~new?rolekind=${roleKind(role)}&rolename=${
      role.metadata.name
    }`,
  }),
  Kebab.factory.Edit,
  Kebab.factory.Delete,
];

const roleColumnClasses = [classNames('col-xs-6'), classNames('col-xs-6'), Kebab.columnClass];

const RolesTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: roleColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: roleColumnClasses[1] },
    },
    { title: '', props: { className: roleColumnClasses[2] } },
  ];
};
RolesTableHeader.displayName = 'RolesTableHeader';

const RolesTableRow = ({ obj: role, index, key, style }) => {
  return (
    <TableRow id={role.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={roleColumnClasses[0]}>
        <ResourceLink
          kind={roleKind(role)}
          name={role.metadata.name}
          namespace={role.metadata.namespace}
        />
      </TableData>
      <TableData className={classNames(roleColumnClasses[1], 'co-break-word')}>
        {role.metadata.namespace ? (
          <ResourceLink kind="Namespace" name={role.metadata.namespace} />
        ) : (
          'All Namespaces'
        )}
      </TableData>
      <TableData className={roleColumnClasses[2]}>
        <ResourceKebab actions={menuActions} kind={roleKind(role)} resource={role} />
      </TableData>
    </TableRow>
  );
};

class Details extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.changeFilter = (val) => this.setState({ ruleFilter: val });
  }

  render() {
    const ruleObj = this.props.obj;
    const { creationTimestamp, name, namespace } = ruleObj.metadata;
    const { ruleFilter } = this.state;

    let rules = ruleObj.rules;
    if (ruleFilter) {
      const fuzzyCaseInsensitive = (a, b) => fuzzy(_.toLower(a), _.toLower(b));
      const searchKeys = ['nonResourceURLs', 'resources', 'verbs'];
      rules = rules.filter((rule) =>
        searchKeys.some((k) => _.some(rule[k], (v) => fuzzyCaseInsensitive(ruleFilter, v))),
      );
    }

    return (
      <div>
        <div className="co-m-pane__body">
          <SectionHeading text="Role Details" />
          <div className="row">
            <div className="col-xs-6">
              <dl className="co-m-pane__details">
                <dt>Role Name</dt>
                <dd>{name}</dd>
                {namespace && (
                  <div>
                    <dt>Namespace</dt>
                    <dd>
                      <ResourceLink kind="Namespace" name={namespace} />
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <div className="col-xs-6">
              <dl className="co-m-pane__details">
                <dt>Created At</dt>
                <dd>
                  <Timestamp timestamp={creationTimestamp} />
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="co-m-pane__body">
          <SectionHeading text="Rules" />
          <div className="co-m-pane__filter-row">
            {/* This page is temporarily disabled until we update the safe resources list.
          <div className="co-m-pane__filter-bar-group">
            <Link to={addHref(name, namespace)} className="co-m-primary-action">
              <button className="btn btn-primary">Add Rule</button>
            </Link>
          </div>
          */}

            <TextFilter label="Rules by action or resource" onChange={this.changeFilter} />
          </div>
          <RulesList rules={rules} name={name} namespace={namespace} />
        </div>
      </div>
    );
  }
}

const bindingsColumnClasses = [
  classNames('col-xs-4'),
  classNames('col-xs-2'),
  classNames('col-xs-4'),
  classNames('col-xs-2'),
];

const BindingsTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: bindingsColumnClasses[0] },
    },
    {
      title: 'Subject Kind',
      sortField: 'subject.kind',
      transforms: [sortable],
      props: { className: bindingsColumnClasses[1] },
    },
    {
      title: 'Subject Name',
      sortField: 'subject.name',
      transforms: [sortable],
      props: { className: bindingsColumnClasses[2] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: bindingsColumnClasses[3] },
    },
  ];
};
BindingsTableHeader.displayName = 'BindingsTableHeader';

const BindingsTableRow = ({ obj: binding, index, key, style }) => {
  return (
    <TableRow id={binding.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={bindingsColumnClasses[0]}>
        <BindingName binding={binding} />
      </TableData>
      <TableData className={bindingsColumnClasses[1]}>{binding.subject.kind}</TableData>
      <TableData className={bindingsColumnClasses[2]}>{binding.subject.name}</TableData>
      <TableData className={bindingsColumnClasses[3]}>
        {binding.namespace || 'All Namespaces'}
      </TableData>
    </TableRow>
  );
};

const BindingsListComponent = (props) => (
  <BindingsList {...props} Header={BindingsTableHeader} Row={BindingsTableRow} virtualize />
);

export const BindingsForRolePage = (props) => {
  const {
    match: {
      params: { name, ns },
    },
    obj: { kind },
  } = props;
  const resources = [{ kind: 'RoleBinding', namespaced: true }];
  if (!ns) {
    resources.push({ kind: 'ClusterRoleBinding', namespaced: false, optional: true });
  }
  return (
    <MultiListPage
      canCreate={true}
      createButtonText="Create Binding"
      createProps={{
        to: `/k8s/${
          ns ? `ns/${ns}` : 'cluster'
        }/rolebindings/~new?rolekind=${kind}&rolename=${name}`,
      }}
      ListComponent={BindingsListComponent}
      staticFilters={[{ 'role-binding-roleRef-name': name }, { 'role-binding-roleRef-kind': kind }]}
      resources={resources}
      textFilter="role-binding"
      filterLabel="by role or subject"
      namespace={ns}
      flatten={bindingsFlatten}
    />
  );
};

export const RolesDetailsPage = (props) => (
  <DetailsPage
    {...props}
    pages={[
      navFactory.details(Details),
      navFactory.editYaml(),
      { href: 'bindings', name: 'Role Bindings', component: BindingsForRolePage },
    ]}
    menuActions={menuActions}
  />
);

export const ClusterRolesDetailsPage = RolesDetailsPage;

const EmptyMsg = () => (
  <MsgBox
    title="No Roles Found"
    detail="Roles grant access to types of objects in the cluster. Roles are applied to a team or user via a Role Binding."
  />
);

const RolesList = (props) => (
  <Table
    {...props}
    aria-label="Roles"
    EmptyMsg={EmptyMsg}
    Header={RolesTableHeader}
    Row={RolesTableRow}
    virtualize
  />
);

export const roleType = (role) => {
  if (!role) {
    return undefined;
  }
  if (isSystemRole(role)) {
    return 'system';
  }
  return role.metadata.namespace ? 'namespace' : 'cluster';
};

export const RolesPage = ({ namespace, mock, showTitle }) => {
  const createNS = namespace || 'default';
  const accessReview = {
    model: RoleModel,
    namespace: createNS,
  };
  return (
    <MultiListPage
      ListComponent={RolesList}
      canCreate={true}
      showTitle={showTitle}
      namespace={namespace}
      createAccessReview={accessReview}
      createButtonText="Create Role"
      createProps={{ to: `/k8s/ns/${createNS}/roles/~new` }}
      flatten={(resources) => _.flatMap(resources, 'data').filter((r) => !!r)}
      resources={[
        { kind: 'Role', namespaced: true, optional: mock },
        { kind: 'ClusterRole', namespaced: false, optional: true },
      ]}
      rowFilters={[
        {
          filterGroupName: 'Role',
          type: 'role-kind',
          reducer: roleType,
          items: [
            { id: 'cluster', title: 'Cluster-wide Roles' },
            { id: 'namespace', title: 'Namespace Roles' },
            { id: 'system', title: 'System Roles' },
          ],
        },
      ]}
      title="Roles"
    />
  );
};

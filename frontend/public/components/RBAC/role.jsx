import * as _ from 'lodash-es';
import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
// import { Link } from 'react-router-dom';
import { RoleModel, RoleBindingModel, ClusterRoleBindingModel } from '../../models';
import * as classNames from 'classnames';
import { useTranslation, withTranslation } from 'react-i18next';
import i18next from 'i18next';
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
  resourceListPathFromModel,
} from '../utils';
import { DetailsForKind } from '../default-resource';
import { getLastNamespace } from '../utils/breadcrumbs';
import { ALL_NAMESPACES_KEY } from '@console/shared';

const { common } = Kebab.factory;

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
    label: i18next.t('public~Add RoleBinding'),
    href: `/k8s/${
      role.metadata.namespace
        ? `ns/${role.metadata.namespace}/rolebindings/~new?rolekind=${roleKind(role)}&rolename=${
            role.metadata.name
          }&namespace=${role.metadata.namespace}`
        : `cluster/rolebindings/~new?rolekind=${roleKind(role)}&rolename=${role.metadata.name}`
    }`,
  }),
  Kebab.factory.Edit,
  Kebab.factory.Delete,
];

const roleColumnClasses = ['', '', Kebab.columnClass];

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
          i18next.t('public~All namespaces')
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
    const { t } = this.props;

    return (
      <div>
        <div className="co-m-pane__body">
          <SectionHeading text={t('public~Role details')} />
          <div className="row">
            <div className="col-xs-6">
              <dl className="co-m-pane__details">
                <dt>{t('public~Role name')}</dt>
                <dd>{name}</dd>
                {namespace && (
                  <div>
                    <dt>{t('public~Namespace')}</dt>
                    <dd>
                      <ResourceLink kind="Namespace" name={namespace} />
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <div className="col-xs-6">
              <dl className="co-m-pane__details">
                <dt>{t('public~Created at')}</dt>
                <dd>
                  <Timestamp timestamp={creationTimestamp} />
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="co-m-pane__body">
          <SectionHeading text={t('public~Rules')} />
          <div className="co-m-pane__filter-row">
            {/* This page is temporarily disabled until we update the safe resources list.
          <div className="co-m-pane__filter-bar-group">
            <Link to={addHref(name, namespace)} className="co-m-primary-action">
              <button className="btn btn-primary">Add Rule</button>
            </Link>
          </div>
          */}

            <TextFilter
              label={t('public~rules by action or resource')}
              onChange={this.changeFilter}
            />
          </div>
          <RulesList rules={rules} name={name} namespace={namespace} />
        </div>
      </div>
    );
  }
}
const DetailsWithTranslation = withTranslation()(Details);

const bindingsColumnClasses = [
  'pf-u-w-33-on-sm',
  'pf-u-w-16-on-sm',
  'pf-u-w-33-on-sm',
  'pf-u-w-16-on-sm',
];

const BindingsTableRow = ({ obj: binding, index, key, style }) => {
  const { t } = useTranslation();
  return (
    <TableRow id={binding.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={bindingsColumnClasses[0]}>
        <BindingName binding={binding} />
      </TableData>
      <TableData className={bindingsColumnClasses[1]}>{binding.subject.kind}</TableData>
      <TableData className={bindingsColumnClasses[2]}>{binding.subject.name}</TableData>
      <TableData className={bindingsColumnClasses[3]}>
        {binding.namespace || t('public~All namespaces')}
      </TableData>
    </TableRow>
  );
};

const BindingsListComponent = (props) => {
  const { t } = useTranslation();
  const BindingsTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: bindingsColumnClasses[0] },
      },
      {
        title: t('public~Subject kind'),
        sortField: 'subject.kind',
        transforms: [sortable],
        props: { className: bindingsColumnClasses[1] },
      },
      {
        title: t('public~Subject name'),
        sortField: 'subject.name',
        transforms: [sortable],
        props: { className: bindingsColumnClasses[2] },
      },
      {
        title: t('public~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: bindingsColumnClasses[3] },
      },
    ];
  };
  BindingsTableHeader.displayName = 'BindingsTableHeader';

  return <BindingsList {...props} Header={BindingsTableHeader} Row={BindingsTableRow} virtualize />;
};

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

  const { t } = useTranslation();
  return (
    <MultiListPage
      canCreate={true}
      createButtonText={t('public~Create binding')}
      createProps={{
        to: `/k8s/${
          ns ? `ns/${ns}` : 'cluster'
        }/rolebindings/~new?rolekind=${kind}&rolename=${name}${ns ? `&namespace=${ns}` : ''}`,
      }}
      ListComponent={BindingsListComponent}
      staticFilters={[{ 'role-binding-roleRef-name': name }, { 'role-binding-roleRef-kind': kind }]}
      resources={resources}
      textFilter="role-binding"
      filterLabel={t('public~by role or subject')}
      namespace={ns}
      flatten={bindingsFlatten}
    />
  );
};

const getBreadcrumbs = (model, kindObj, match) => {
  const lastNamespace = getLastNamespace();
  return [
    {
      name: model.labelPluralKey ? i18next.t(model.labelPluralKey) : model.labelPlural,
      path: resourceListPathFromModel(
        model,
        !lastNamespace || lastNamespace === ALL_NAMESPACES_KEY ? null : lastNamespace,
      ),
    },
    {
      name: i18next.t('public~{{kind}} details', {
        kind: kindObj.labelKey ? i18next.t(kindObj.labelKey) : kindObj.label,
      }),
      path: `${match.url}`,
    },
  ];
};

export const RolesDetailsPage = (props) => {
  const { t } = useTranslation();
  return (
    <DetailsPage
      {...props}
      pages={[
        navFactory.details(DetailsWithTranslation),
        navFactory.editYaml(),
        { href: 'bindings', name: t('public~RoleBindings'), component: BindingsForRolePage },
      ]}
      menuActions={menuActions}
      breadcrumbsFor={() => getBreadcrumbs(RoleModel, props.kindObj, props.match)}
    />
  );
};

export const ClusterRolesDetailsPage = RolesDetailsPage;

export const ClusterRoleBindingsDetailsPage = (props) => {
  const pages = [navFactory.details(DetailsForKind(props.kind)), navFactory.editYaml()];
  const actions = [...Kebab.getExtensionsActionsForKind(ClusterRoleBindingModel), ...common];

  return (
    <DetailsPage
      {...props}
      menuActions={actions}
      pages={pages}
      breadcrumbsFor={() => getBreadcrumbs(RoleBindingModel, props.kindObj, props.match)}
    />
  );
};

const EmptyMsg = () => {
  const { t } = useTranslation();
  return (
    <MsgBox
      title={t('public~No Roles found')}
      detail={t(
        'public~Roles grant access to types of objects in the cluster. Roles are applied to a team or user via a RoleBinding.',
      )}
    />
  );
};

const RolesList = (props) => {
  const { t } = useTranslation();
  const RolesTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: roleColumnClasses[0] },
      },
      {
        title: t('public~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: roleColumnClasses[1] },
      },
      { title: '', props: { className: roleColumnClasses[2] } },
    ];
  };
  return (
    <Table
      {...props}
      aria-label={t('public~Roles')}
      EmptyMsg={EmptyMsg}
      Header={RolesTableHeader}
      Row={RolesTableRow}
      virtualize
    />
  );
};

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
  const { t } = useTranslation();
  return (
    <MultiListPage
      ListComponent={RolesList}
      canCreate={true}
      showTitle={showTitle}
      namespace={namespace}
      createAccessReview={accessReview}
      createButtonText={t('public~Create Role')}
      createProps={{ to: `/k8s/ns/${createNS}/roles/~new` }}
      flatten={(resources) => _.flatMap(resources, 'data').filter((r) => !!r)}
      resources={[
        { kind: 'Role', namespaced: true, optional: mock },
        { kind: 'ClusterRole', namespaced: false, optional: true },
      ]}
      rowFilters={[
        {
          filterGroupName: t('public~Role'),
          type: 'role-kind',
          reducer: roleType,
          items: [
            { id: 'cluster', title: t('public~Cluster-wide Roles') },
            { id: 'namespace', title: t('public~Namespace Roles') },
            { id: 'system', title: t('public~System Roles') },
          ],
        },
      ]}
      title={t('public~Roles')}
    />
  );
};

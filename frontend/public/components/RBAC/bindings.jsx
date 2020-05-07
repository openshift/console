import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { ActionGroup, Button } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import { FLAGS } from '@console/shared/src/constants';
import { connectToFlags, flagPending } from '@console/shared/src/hocs/connect-flags';
import { ClusterRoleBindingModel } from '../../models';
import { getQN, k8sCreate, k8sPatch, referenceFor } from '../../module/k8s';
import * as UIActions from '../../actions/ui';
import { MultiListPage, Table, TableRow, TableData } from '../factory';
import { RadioGroup } from '../radio';
import { confirmModal } from '../modals';
import {
  ButtonBar,
  Kebab,
  Firehose,
  ListDropdown,
  MsgBox,
  NsDropdown,
  ResourceKebab,
  ResourceLink,
  ResourceName,
  StatusBox,
  getQueryArgument,
  history,
  kindObj,
  resourceObjPath,
  useAccessReview,
} from '../utils';
import { isSystemRole } from './index';

const bindingKind = (binding) =>
  binding.metadata.namespace ? 'RoleBinding' : 'ClusterRoleBinding';

// Split each binding into one row per subject
export const flatten = (resources) =>
  _.flatMap(resources, (resource) => {
    const ret = [];

    _.each(resource.data, (binding) => {
      if (!binding) {
        return undefined;
      }
      if (_.isEmpty(binding.subjects)) {
        const subject = { kind: '-', name: '-' };
        return ret.push(Object.assign({}, binding, { subject }));
      }
      _.each(binding.subjects, (subject, subjectIndex) => {
        ret.push(
          Object.assign({}, binding, {
            subject,
            subjectIndex,
            rowKey: `${getQN(binding)}|${subject.kind}|${subject.name}${
              subject.namespace ? `|${subject.namespace}` : ''
            }`,
          }),
        );
      });
    });

    return ret;
  });

const menuActions = ({ subjectIndex, subjects }, startImpersonate) => {
  const subject = subjects[subjectIndex];

  const actions = [
    (kind, obj) => ({
      label: `Duplicate ${kind.label}`,
      href: `${resourceObjPath(obj, kind.kind)}/copy?subjectIndex=${subjectIndex}`,
      // Only perform access checks when duplicating cluster role bindings.
      // It's not practical to check namespace role bindings since we don't know what namespace the user will pick in the form.
      accessReview: _.get(obj, 'metadata.namespace')
        ? null
        : { group: kind.apiGroup, resource: kind.plural, verb: 'create' },
    }),
    (kind, obj) => ({
      label: `Edit ${kind.label} Subject`,
      href: `${resourceObjPath(obj, kind.kind)}/edit?subjectIndex=${subjectIndex}`,
      accessReview: {
        group: kind.apiGroup,
        resource: kind.plural,
        name: obj.metadata.name,
        namespace: obj.metadata.namespace,
        verb: 'update',
      },
    }),
    subjects.length === 1
      ? Kebab.factory.Delete
      : (kind, binding) => ({
          label: `Delete ${kind.label} Subject`,
          callback: () =>
            confirmModal({
              title: `Delete ${kind.label} Subject`,
              message: `Are you sure you want to delete subject ${subject.name} of type ${subject.kind}?`,
              btnText: 'Delete Subject',
              executeFn: () =>
                k8sPatch(kind, binding, [{ op: 'remove', path: `/subjects/${subjectIndex}` }]),
            }),
          accessReview: {
            group: kind.apiGroup,
            resource: kind.plural,
            name: binding.metadata.name,
            namespace: binding.metadata.namespace,
            verb: 'patch',
          },
        }),
  ];

  if (subject.kind === 'User' || subject.kind === 'Group') {
    actions.unshift(() => ({
      label: `Impersonate ${subject.kind} "${subject.name}"`,
      callback: () => startImpersonate(subject.kind, subject.name),
    }));
  }

  return actions;
};

const tableColumnClasses = [
  classNames('col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  Kebab.columnClass,
];

const RoleBindingsTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Role Ref',
      sortField: 'roleRef.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Subject Kind',
      sortField: 'subject.kind',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Subject Name',
      sortField: 'subject.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
RoleBindingsTableHeader.displayName = 'RoleBindingsTableHeader';

export const BindingName = ({ binding }) => {
  <ResourceLink
    kind={bindingKind(binding)}
    name={binding.metadata.name}
    namespace={binding.metadata.namespace}
    className="co-resource-item__resource-name"
  />;
};

export const BindingKebab = connect(null, {
  startImpersonate: UIActions.startImpersonate,
})(({ binding, startImpersonate }) =>
  binding.subjects ? (
    <ResourceKebab
      actions={menuActions(binding, startImpersonate)}
      kind={bindingKind(binding)}
      resource={binding}
    />
  ) : null,
);

export const RoleLink = ({ binding }) => {
  const kind = binding.roleRef.kind;

  // Cluster Roles have no namespace and for Roles, the Role's namespace matches the Role Binding's namespace
  const ns = kind === 'ClusterRole' ? undefined : binding.metadata.namespace;
  return <ResourceLink kind={kind} name={binding.roleRef.name} namespace={ns} />;
};

const RoleBindingsTableRow = ({ obj: binding, index, key, style }) => {
  return (
    <TableRow id={binding.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={bindingKind(binding)}
          name={binding.metadata.name}
          namespace={binding.metadata.namespace}
          className="co-resource-item__resource-name"
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <RoleLink binding={binding} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[2], 'co-break-word')}>
        {binding.subject.kind}
      </TableData>
      <TableData className={classNames(tableColumnClasses[3], 'co-break-word')}>
        {binding.subject.name}
      </TableData>
      <TableData className={classNames(tableColumnClasses[4], 'co-break-word')}>
        {binding.metadata.namespace ? (
          <ResourceLink kind="Namespace" name={binding.metadata.namespace} />
        ) : (
          'All Namespaces'
        )}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <BindingKebab binding={binding} />
      </TableData>
    </TableRow>
  );
};

const EmptyMsg = () => (
  <MsgBox
    title="No Role Bindings Found"
    detail="Roles grant access to types of objects in the cluster. Roles are applied to a group or user via a Role Binding."
  />
);

export const BindingsList = (props) => (
  <Table
    {...props}
    aria-label="Role Bindings"
    EmptyMsg={EmptyMsg}
    Header={RoleBindingsTableHeader}
    Row={RoleBindingsTableRow}
    virtualize
  />
);

export const bindingType = (binding) => {
  if (!binding) {
    return undefined;
  }
  if (binding.roleRef.name.startsWith('system:')) {
    return 'system';
  }
  return binding.metadata.namespace ? 'namespace' : 'cluster';
};

const roleResources = [
  { kind: 'RoleBinding', namespaced: true },
  { kind: 'ClusterRoleBinding', namespaced: false, optional: true },
];

const rowFilters = [
  {
    filterGroupName: 'Kind',
    type: 'role-binding-kind',
    reducer: bindingType,
    itemsGenerator: ({ ClusterRoleBinding: data }) => {
      const items = [
        { id: 'namespace', title: 'Namespace Role Bindings' },
        { id: 'system', title: 'System Role Bindings' },
      ];
      if (data && data.loaded && !data.loadError) {
        items.unshift({ id: 'cluster', title: 'Cluster-wide Role Bindings' });
      }
      return items;
    },
  },
];

export const RoleBindingsPage = ({
  namespace = undefined,
  showTitle = true,
  mock = false,
  staticFilters = undefined,
  createPath = '/k8s/cluster/rolebindings/~new',
}) => (
  <MultiListPage
    canCreate={!mock}
    createButtonText="Create Binding"
    createProps={{
      to: createPath,
    }}
    mock={mock}
    filterLabel="by role or subject"
    flatten={flatten}
    label="Role Bindings"
    ListComponent={BindingsList}
    namespace={namespace}
    resources={roleResources}
    rowFilters={staticFilters ? [] : rowFilters}
    staticFilters={staticFilters}
    showTitle={showTitle}
    textFilter="role-binding"
    title="Role Bindings"
  />
);

const NsRoleDropdown_ = (props) => {
  const openshiftFlag = props.flags[FLAGS.OPENSHIFT];
  if (flagPending(openshiftFlag)) {
    return null;
  }

  const roleFilter = (role) => !isSystemRole(role);

  let kinds;
  if (props.fixed) {
    kinds = [props.selectedKeyKind];
  } else if (props.namespace) {
    kinds = ['Role', 'ClusterRole'];
  } else {
    kinds = ['ClusterRole'];
  }
  const resourceForKind = (kind) => ({ kind, namespace: kind === 'Role' ? props.namespace : null });
  const resources = _.map(kinds, resourceForKind);

  return (
    <ListDropdown
      {...props}
      dataFilter={roleFilter}
      desc="Namespace Roles (Role)"
      resources={resources}
      placeholder="Select role name"
    />
  );
};
const NsRoleDropdown = connectToFlags(FLAGS.OPENSHIFT)(NsRoleDropdown_);

const ClusterRoleDropdown = (props) => (
  <ListDropdown
    {...props}
    dataFilter={(role) => !isSystemRole(role)}
    desc="Cluster-wide Roles (ClusterRole)"
    resources={[{ kind: 'ClusterRole' }]}
    placeholder="Select role name"
  />
);

const bindingKinds = [
  {
    value: 'RoleBinding',
    title: 'Namespace Role Binding (RoleBinding)',
    desc: 'Grant the permissions to a user or set of users within the selected namespace.',
  },
  {
    value: 'ClusterRoleBinding',
    title: 'Cluster-wide Role Binding (ClusterRoleBinding)',
    desc:
      'Grant the permissions to a user or set of users at the cluster level and in all namespaces.',
  },
];
const subjectKinds = [
  { value: 'User', title: 'User' },
  { value: 'Group', title: 'Group' },
  { value: 'ServiceAccount', title: 'Service Account' },
];

const Section = ({ label, children }) => (
  <div>
    <div className="co-form-section__label">{label}</div>
    <div className="co-form-subsection">{children}</div>
  </div>
);

const BaseEditRoleBinding = connect(null, { setActiveNamespace: UIActions.setActiveNamespace })(
  class BaseEditRoleBinding_ extends React.Component {
    constructor(props) {
      super(props);

      this.subjectIndex = props.subjectIndex || 0;

      const existingData = _.pick(props.obj, [
        'metadata.name',
        'metadata.namespace',
        'roleRef',
        'subjects',
      ]);
      existingData.kind = props.kind;
      const data = _.defaultsDeep({}, props.fixed, existingData, {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'RoleBinding',
        metadata: {
          name: '',
        },
        roleRef: {
          apiGroup: 'rbac.authorization.k8s.io',
        },
        subjects: [
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'User',
            name: '',
          },
        ],
      });
      this.state = { data, inProgress: false };

      this.setKind = this.setKind.bind(this);
      this.setSubject = this.setSubject.bind(this);
      this.save = this.save.bind(this);

      this.setData = (patch) => this.setState({ data: _.defaultsDeep({}, patch, this.state.data) });
      this.changeName = (e) => this.setData({ metadata: { name: e.target.value } });
      this.changeNamespace = (namespace) => this.setData({ metadata: { namespace } });
      this.changeRoleRef = (name, kindId) => this.setData({ roleRef: { name, kind: kindId } });
      this.changeSubjectKind = (e) => this.setSubject({ kind: e.target.value });
      this.changeSubjectName = (e) => this.setSubject({ name: e.target.value });
      this.changeSubjectNamespace = (namespace) => this.setSubject({ namespace });
    }

    setKind(e) {
      const kind = e.target.value;
      const patch = { kind };
      if (kind === 'ClusterRoleBinding') {
        patch.metadata = { namespace: null };
      }
      this.setData(patch);
    }

    getSubject() {
      return _.get(this.state.data, `subjects[${this.subjectIndex}]`);
    }

    setSubject(patch) {
      const { kind, name, namespace } = Object.assign({}, this.getSubject(), patch);
      const data = Object.assign({}, this.state.data);
      data.subjects[this.subjectIndex] =
        kind === 'ServiceAccount'
          ? { kind, name, namespace }
          : { apiGroup: 'rbac.authorization.k8s.io', kind, name };
      this.setState({ data });
    }

    save(e) {
      e.preventDefault();

      const { kind, metadata, roleRef } = this.state.data;
      const subject = this.getSubject();

      if (
        !kind ||
        !metadata.name ||
        !roleRef.kind ||
        !roleRef.name ||
        !subject.kind ||
        !subject.name ||
        (kind === 'RoleBinding' && !metadata.namespace) ||
        (subject.kind === 'ServiceAccount' && !subject.namespace)
      ) {
        this.setState({ error: 'Please complete all fields.' });
        return;
      }

      this.setState({ inProgress: true });

      const ko = kindObj(kind);
      (this.props.isCreate
        ? k8sCreate(ko, this.state.data)
        : k8sPatch(ko, { metadata }, [
            { op: 'replace', path: `/subjects/${this.subjectIndex}`, value: subject },
          ])
      ).then(
        (obj) => {
          this.setState({ inProgress: false });
          if (metadata.namespace) {
            this.props.setActiveNamespace(metadata.namespace);
          }
          history.push(resourceObjPath(obj, referenceFor(obj)));
        },
        (err) => this.setState({ error: err.message, inProgress: false }),
      );
    }

    render() {
      const { kind, metadata, roleRef } = this.state.data;
      const subject = this.getSubject();
      const { fixed, saveButtonText } = this.props;
      const RoleDropdown = kind === 'RoleBinding' ? NsRoleDropdown : ClusterRoleDropdown;
      const title = `${this.props.titleVerb} ${kindObj(kind).label}`;

      return (
        <div className="co-m-pane__body">
          <Helmet>
            <title>{title}</title>
          </Helmet>
          <form className="co-m-pane__body-group co-m-pane__form" onSubmit={this.save}>
            <h1 className="co-m-pane__heading">{title}</h1>
            <p className="co-m-pane__explanation">
              Associate a user/group to the selected role to define the type of access and resources
              that are allowed.
            </p>

            {!_.get(fixed, 'kind') && (
              <Section label="Binding Type">
                <RadioGroup currentValue={kind} items={bindingKinds} onChange={this.setKind} />
              </Section>
            )}

            <div className="co-form-section__separator" />

            <Section label="Role Binding">
              <div className="form-group">
                <label htmlFor="role-binding-name" className="co-required">
                  Name
                </label>
                {_.get(fixed, 'metadata.name') ? (
                  <ResourceName kind={kind} name={metadata.name} />
                ) : (
                  <input
                    className="pf-c-form-control"
                    type="text"
                    onChange={this.changeName}
                    placeholder="Role binding name"
                    value={metadata.name}
                    required
                    id="role-binding-name"
                  />
                )}
              </div>
              {kind === 'RoleBinding' && (
                <div className="form-group">
                  <label htmlFor="ns-dropdown" className="co-required">
                    Namespace
                  </label>
                  <NsDropdown
                    fixed={!!_.get(fixed, 'metadata.namespace')}
                    selectedKey={metadata.namespace}
                    onChange={this.changeNamespace}
                    id="ns-dropdown"
                  />
                </div>
              )}
            </Section>

            <div className="co-form-section__separator" />

            <Section label="Role">
              <div className="form-group">
                <label htmlFor="role-dropdown" className="co-required">
                  Role Name
                </label>
                <RoleDropdown
                  fixed={!!_.get(fixed, 'roleRef.name')}
                  namespace={metadata.namespace}
                  onChange={this.changeRoleRef}
                  selectedKey={_.get(fixed, 'roleRef.name') || roleRef.name}
                  selectedKeyKind={_.get(fixed, 'roleRef.kind') || roleRef.kind}
                  id="role-dropdown"
                />
              </div>
            </Section>

            <div className="co-form-section__separator" />

            <Section label="Subject">
              <div className="form-group">
                <RadioGroup
                  currentValue={subject.kind}
                  items={subjectKinds}
                  onChange={this.changeSubjectKind}
                />
              </div>
              {subject.kind === 'ServiceAccount' && (
                <div className="form-group">
                  <label htmlFor="subject-namespace" className="co-required">
                    Subject Namespace
                  </label>
                  <NsDropdown
                    id="subject-namespace"
                    selectedKey={subject.namespace}
                    onChange={this.changeSubjectNamespace}
                  />
                </div>
              )}
              <div className="form-group">
                <label htmlFor="subject-name" className="co-required">
                  Subject Name
                </label>
                <input
                  className="pf-c-form-control"
                  type="text"
                  onChange={this.changeSubjectName}
                  placeholder="Subject name"
                  value={subject.name}
                  required
                  id="subject-name"
                />
              </div>
            </Section>

            <div className="co-form-section__separator" />

            <ButtonBar errorMessage={this.state.error} inProgress={this.state.inProgress}>
              <ActionGroup className="pf-c-form">
                <Button type="submit" id="save-changes" variant="primary">
                  {saveButtonText || 'Create'}
                </Button>
                <Button onClick={history.goBack} id="cancel" variant="secondary">
                  Cancel
                </Button>
              </ActionGroup>
            </ButtonBar>
          </form>
        </div>
      );
    }
  },
);

export const CreateRoleBinding = ({ match: { params }, location }) => {
  const searchParams = new URLSearchParams(location.search);
  const roleKind = searchParams.get('rolekind');
  const roleName = searchParams.get('rolename');
  const metadata = { namespace: UIActions.getActiveNamespace() };
  const clusterAllowed = useAccessReview({
    group: ClusterRoleBindingModel.apiGroup,
    resource: ClusterRoleBindingModel.plural,
    verb: 'create',
  });
  const fixed = {
    kind: params.ns || roleKind === 'Role' || !clusterAllowed ? 'RoleBinding' : undefined,
    metadata: { namespace: params.ns },
    roleRef: { kind: roleKind, name: roleName },
  };
  return (
    <BaseEditRoleBinding metadata={metadata} fixed={fixed} isCreate={true} titleVerb="Create" />
  );
};

const getSubjectIndex = () => {
  const subjectIndex = getQueryArgument('subjectIndex') || '0';
  return parseInt(subjectIndex, 10);
};

const BindingLoadingWrapper = (props) => {
  const fixed = {};
  _.each(props.fixedKeys, (k) => (fixed[k] = _.get(props.obj.data, k)));
  return (
    <StatusBox {...props.obj}>
      <BaseEditRoleBinding {...props} obj={props.obj.data} fixed={fixed} />
    </StatusBox>
  );
};

export const EditRoleBinding = ({ match: { params }, kind }) => (
  <Firehose
    resources={[{ kind, name: params.name, namespace: params.ns, isList: false, prop: 'obj' }]}
  >
    <BindingLoadingWrapper
      fixedKeys={['kind', 'metadata', 'roleRef']}
      subjectIndex={getSubjectIndex()}
      titleVerb="Edit"
      saveButtonText="Save"
    />
  </Firehose>
);

export const CopyRoleBinding = ({ match: { params }, kind }) => (
  <Firehose
    resources={[{ kind, name: params.name, namespace: params.ns, isList: false, prop: 'obj' }]}
  >
    <BindingLoadingWrapper
      isCreate={true}
      fixedKeys={['kind']}
      subjectIndex={getSubjectIndex()}
      titleVerb="Duplicate"
    />
  </Firehose>
);

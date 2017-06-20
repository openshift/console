import React from 'react';
import fuzzy from 'fuzzysearch';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import { getQN, k8s, k8sCreate, k8sKinds, k8sPatch } from '../../module/k8s';
import { getActiveNamespace, getNamespacedRoute, UIActions } from '../../ui/ui-actions';
import { ColHead, List, ListHeader, MultiListPage } from '../factory';
import { RadioGroup } from '../radio';
import { confirmModal } from '../modals';
import { SafetyFirst } from '../safety-first';
import { ButtonBar, Cog, Dropdown, Firehose, history, kindObj, LoadingInline, MsgBox, MultiFirehose, ResourceCog, ResourceName, ResourceLink, resourceObjPath, StatusBox } from '../utils';
import { isSystemRole } from './index';

const bindingKind = binding => binding.metadata.namespace ? 'rolebinding' : 'clusterrolebinding';

const k8sKind = kindId => _.get(k8sKinds, `${_.toUpper(kindId)}.kind`);

// Split each binding into one row per subject
const rowSplitter = binding => {
  if (!binding) {
    return undefined;
  }
  if (_.isEmpty(binding.subjects)) {
    const subject = {kind: '-', name: '-'};
    return [Object.assign({}, binding, {subject})];
  }
  return binding.subjects.map((subject, subjectIndex) => Object.assign({}, binding, {
    subject,
    subjectIndex,
    rowKey: `${getQN(binding)}|${subject.kind}|${subject.name}`,
  }));
};

const menuActions = ({subjectIndex, subjects}, startImpersonate) => {
  const subject = subjects[subjectIndex];

  const actions = [
    (kind, obj) => ({
      label: `Duplicate ${kind.label}...`,
      weight: 700,
      href: `${resourceObjPath(obj, kind.id)}/copy?subjectIndex=${subjectIndex}`,
    }),
    (kind, obj) => ({
      label: `Edit ${kind.label} Subject...`,
      weight: 800,
      href: `${resourceObjPath(obj, kind.id)}/edit?subjectIndex=${subjectIndex}`,
    }),
    subjects.length === 1 ? Cog.factory.Delete : (kind, binding) => ({
      label: `Delete ${kind.label} Subject...`,
      weight: 900,
      callback: () => confirmModal({
        title: `Delete ${kind.label} Subject`,
        message: `Are you sure you want to delete subject ${subject.name} of type ${subject.kind}?`,
        btnText: 'Delete Subject',
        executeFn: () => k8s[kind.plural].patch(binding, [{op: 'remove', path: `/subjects/${subjectIndex}`}]),
      }),
    }),
  ];

  if (subject.kind === 'User' || subject.kind === 'Group') {
    actions.push(() => ({
      label: `Impersonate ${subject.kind} "${subject.name}"...`,
      weight: 600,
      href: '/',
      callback: () => startImpersonate(subject.kind, subject.name),
    }));
  }

  return actions;
};

const Header = props => <ListHeader>
  <ColHead {...props} className="col-xs-3" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="roleRef.name">Role Ref</ColHead>
  <div className="col-xs-6">
    <ColHead {...props} className="col-xs-3" sortField="subject.kind">Subject Kind</ColHead>
    <ColHead {...props} className="col-xs-5" sortField="subject.name">Subject Name</ColHead>
    <ColHead {...props} className="col-xs-4" sortField="metadata.namespace">Namespace</ColHead>
  </div>
</ListHeader>;

export const BindingName = connect(null, {startImpersonate: UIActions.startImpersonate})(
({binding, startImpersonate}) => <span>
  <ResourceCog actions={menuActions(binding, startImpersonate)} kind={bindingKind(binding)} resource={binding} />
  <ResourceName kind={bindingKind(binding)} name={binding.metadata.name} />
</span>);

export const RoleLink = ({binding}) => {
  const kind = binding.roleRef.kind.toLowerCase();

  // Cluster Roles have no namespace and for Roles, the Role's namespace matches the Role Binding's namespace
  const ns = kind === 'clusterrole' ? undefined : binding.metadata.namespace;
  return <ResourceLink kind={kind} name={binding.roleRef.name} namespace={ns} />;
};

const Row = ({obj: binding}) => <div className="row co-resource-list__item">
  <div className="col-xs-3">
    <BindingName binding={binding} />
  </div>
  <div className="col-xs-3">
    <RoleLink binding={binding} />
  </div>
  <div className="col-xs-6">
    <div className="col-xs-3">
      {binding.subject.kind}
    </div>
    <div className="col-xs-5">
      {binding.subject.name}
    </div>
    <div className="col-xs-4">
      {binding.metadata.namespace ? <ResourceLink kind="namespace" name={binding.metadata.namespace} /> : 'all'}
    </div>
  </div>
</div>;

const EmptyMsg = () => <MsgBox title="No Role Bindings Found" detail="Roles grant access to types of objects in the cluster. Roles are applied to a group or user via a Role Binding." />;

export const BindingsList = props => <List {...props} EmptyMsg={EmptyMsg} rowSplitter={rowSplitter} />;

export const bindingType = binding => {
  if (!binding) {
    return undefined;
  }
  if (binding.roleRef.name.startsWith('system:')) {
    return 'system';
  }
  return binding.metadata.namespace ? 'namespace' : 'cluster';
};

const resources = [
  {kind: 'rolebinding', namespaced: true},
  {kind: 'clusterrolebinding', namespaced: false},
];

export const RoleBindingsPage = () => <MultiListPage
  ListComponent={props => <BindingsList {...props} Header={Header} Row={Row} />}
  canCreate={true}
  createButtonText="Create Binding"
  createProps={{to: 'rolebindings/new'}}
  filterLabel="Role Bindings by role or subject"
  resources={resources}
  rowFilters={[{
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
  }]}
  rowSplitter={rowSplitter}
  textFilter="role-binding"
  title="Role Bindings"
/>;

const ListDropdown_ = ({dataFilter, desc, fixedKey, loaded, loadError, onChange, placeholder, resources, selectedKey}) => {
  const items = {};
  let autocompleteFilter, title, newOnChange;
  if (loadError) {
    title = <div className="cos-error-title">Error Loading {desc}</div>;
  } else if (!loaded) {
    title = <LoadingInline />;
  } else {
    _.each(resources, ({data}, kind) => {
      _.each(data, resource => {
        if (!dataFilter || dataFilter(resource)) {
          items[resource.metadata.name] = <ResourceName kind={kind} name={resource.metadata.name} />;
        }
      });
    });

    title = <span className="text-muted">{placeholder}</span>;

    autocompleteFilter = (text, item) => fuzzy(text, item.props.name);

    // Pass both the resource name and the resource kind to onChange()
    newOnChange = key => onChange(key, items[key].props.kind);
  }
  return <div>
    {_.has(items, fixedKey) ? items[fixedKey] : <Dropdown autocompleteFilter={autocompleteFilter} autocompletePlaceholder={placeholder} items={items} selectedKey={selectedKey} title={title} onChange={newOnChange} />}
    {loaded && _.isEmpty(items) && <p className="alert alert-info">No {desc} found or defined.</p>}
  </div>;
};

const ListDropdown = props => <MultiFirehose resources={props.kinds.map(kind => ({kind, isList: true, prop: kind}))}>
  <ListDropdown_ {...props} />
</MultiFirehose>;

const NsDropdown = props => <ListDropdown {...props} desc="Namespaces" kinds={['namespace']} placeholder="Select namespace" />;

const NsRoleDropdown = props => {
  const roleFilter = role => !isSystemRole(role) && (!props.namespace || !role.metadata.namespace || role.metadata.namespace === props.namespace);
  return <ListDropdown
    {...props}
    dataFilter={roleFilter}
    desc="Namespace Roles (Role)"
    kinds={props.fixedKind ? [_.toLower(props.fixedKind)] : ['role', 'clusterrole']}
    placeholder="Select role name"
  />;
};

const ClusterRoleDropdown = props => <ListDropdown
  {...props}
  dataFilter={role => !isSystemRole(role)}
  desc="Cluster-wide Roles (ClusterRole)"
  kinds={['clusterrole']}
  placeholder="Select role name"
/>;

const bindingKinds = [
  {value: 'RoleBinding', title: 'Namespace Role Binding (RoleBinding)', desc: 'Grant the permissions to a user or set of users within the selected namespace.'},
  {value: 'ClusterRoleBinding', title: 'Cluster-wide Role Binding (ClusterRoleBinding)', desc: 'Grant the permissions to a user or set of users at the cluster level and in all namespaces.'},
];
const subjectKinds = [
  {value: 'User', title: 'User'},
  {value: 'Group', title: 'Group'},
  {value: 'ServiceAccount', title: 'Service Account'},
];

const Section = ({label, children}) => <div className="row">
  <div className="col-xs-2">
    <label>{label}:</label>
  </div>
  <div className="col-xs-10">
    {children}
  </div>
</div>;

const BaseEditRoleBinding = connect(null, {setActiveNamespace: UIActions.setActiveNamespace})(
class BaseEditRoleBinding_ extends SafetyFirst {
  constructor (props) {
    super(props);

    this.subjectIndex = props.subjectIndex || 0;

    const existingData = _.pick(props, ['kind', 'metadata.name', 'metadata.namespace', 'roleRef', 'subjects']);
    const data = _.defaultsDeep({}, props.fixed, existingData, {
      apiVersion: 'rbac.authorization.k8s.io/v1beta1',
      kind: 'RoleBinding',
      metadata: {
        name: '',
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
      },
      subjects: [{
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: '',
      }],
    });
    this.state = {data, inProgress: false};

    this.setKind = this.setKind.bind(this);
    this.setSubject = this.setSubject.bind(this);
    this.save = this.save.bind(this);

    this.setData = patch => this.setState({data: _.defaultsDeep({}, patch, this.state.data)});
    this.changeName = e => this.setData({metadata: {name: e.target.value}});
    this.changeNamespace = namespace => this.setData({metadata: {namespace}});
    this.changeRoleRef = (name, kindId) => this.setData({roleRef: {name, kind: k8sKind(kindId)}});
    this.changeSubjectKind = e => this.setSubject({kind: e.target.value});
    this.changeSubjectName = e => this.setSubject({name: e.target.value});
    this.changeSubjectNamespace = namespace => this.setSubject({namespace});
  }

  setKind (e) {
    const kind = e.target.value;
    const patch = {kind};
    if (kind === 'ClusterRoleBinding') {
      patch['metadata'] = {namespace: null};
    }
    this.setData(patch);
  }

  getSubject () {
    return _.get(this.state.data, `subjects[${this.subjectIndex}]`);
  }

  setSubject (patch) {
    const {kind, name, namespace} = Object.assign({}, this.getSubject(), patch);
    const data = Object.assign({}, this.state.data);
    data.subjects[this.subjectIndex] = kind === 'ServiceAccount' ? {kind, name, namespace} : {apiGroup: 'rbac.authorization.k8s.io', kind, name};
    this.setState({data});
  }

  save (e) {
    e.preventDefault();

    const {kind, metadata, roleRef} = this.state.data;
    const subject = this.getSubject();

    if (!kind || !metadata.name || !roleRef.kind || !roleRef.name || !subject.kind || !subject.name ||
      (kind === 'RoleBinding' && !metadata.namespace) ||
      (subject.kind === 'ServiceAccount') && !subject.namespace) {
      this.setState({error: 'Please complete all fields.'});
      return;
    }

    this.setState({inProgress: true});

    const ko = kindObj(kind);
    (this.props.isCreate
      ? k8sCreate(ko, this.state.data)
      : k8sPatch(ko, {metadata}, [{op: 'replace', path: `/subjects/${this.subjectIndex}`, value: subject}])
    ).then(
      () => {
        this.setState({inProgress: false});
        if (metadata.namespace) {
          this.props.setActiveNamespace(metadata.namespace);
        }
        history.push(getNamespacedRoute('rolebindings'));
      },
      e => this.setState({error: e.message, inProgress: false})
    );
  }

  render () {
    const {kind, metadata, roleRef} = this.state.data;
    const subject = this.getSubject();
    const {fixed, saveButtonText} = this.props;
    const RoleDropdown = kind === 'RoleBinding' ? NsRoleDropdown : ClusterRoleDropdown;
    const title = `${this.props.titleVerb} ${kindObj(kind).label}`;

    return <div className="rbac-edit-binding co-m-pane__body">
      <Helmet title={title} />
      <form className="co-m-pane__body-group" onSubmit={this.save}>
        <h1 className="co-m-pane__title">{title}</h1>
        <div className="co-m-pane__explanation">Associate a user/group to the selected role to define the type of access and resources that are allowed.</div>

        {!_.get(fixed, 'kind') && <RadioGroup currentValue={kind} items={bindingKinds} onChange={this.setKind} />}

        <div className="separator"></div>

        <Section label="Role Binding">
          <p className="rbac-edit-binding__input-label">Name:</p>
          {_.get(fixed, 'metadata.name')
            ? <ResourceName kind={kind} name={metadata.name} />
            : <input className="form-control" type="text" onChange={this.changeName} placeholder="Role binding name" value={metadata.name} required />}
          {kind === 'RoleBinding' && <div>
            <div className="separator"></div>
            <p className="rbac-edit-binding__input-label">Namespace:</p>
            <NsDropdown fixedKey={_.get(fixed, 'metadata.namespace')} selectedKey={metadata.namespace} onChange={this.changeNamespace} />
          </div>}
        </Section>

        <div className="separator"></div>

        <Section label="Role">
          <p className="rbac-edit-binding__input-label">Role Name:</p>
          <RoleDropdown
            fixedKey={_.get(fixed, 'roleRef.name')}
            fixedKind={_.get(fixed, 'roleRef.kind')}
            namespace={metadata.namespace}
            onChange={this.changeRoleRef}
            selectedKey={roleRef.name}
          />
        </Section>

        <div className="separator"></div>

        <Section label="Subject">
          <RadioGroup currentValue={subject.kind} items={subjectKinds} onChange={this.changeSubjectKind} />
          {subject.kind === 'ServiceAccount' && <div>
            <div className="separator"></div>
            <p className="rbac-edit-binding__input-label">Subject Namespace:</p>
            <NsDropdown selectedKey={subject.namespace} onChange={this.changeSubjectNamespace} />
          </div>}
          <div className="separator"></div>
          <p className="rbac-edit-binding__input-label">Subject Name:</p>
          <input className="form-control" type="text" onChange={this.changeSubjectName} placeholder="Subject name" value={subject.name} required />
        </Section>

        <div className="separator"></div>

        <ButtonBar errorMessage={this.state.error} inProgress={this.state.inProgress}>
          <button type="submit" className="btn btn-primary">{saveButtonText || 'Create Binding'}</button>
          <Link to={getNamespacedRoute('rolebindings')}>Cancel</Link>
        </ButtonBar>
      </form>
    </div>;
  }
});

export const CreateRoleBinding = ({location: {query}}) => <BaseEditRoleBinding
  metadata={{
    namespace: getActiveNamespace(),
  }}
  fixed={{
    kind: (query.ns || query.rolekind === 'role') ? 'RoleBinding' : undefined,
    metadata: {namespace: query.ns},
    roleRef: {kind: k8sKind(query.rolekind), name: query.rolename},
  }}
  isCreate={true}
  titleVerb="Create"
/>;

const EditBinding = props => {
  const {kind, metadata, roleRef} = props;
  return <BaseEditRoleBinding {...props} fixed={{kind, metadata, roleRef}} saveButtonText="Save Binding" />;
};

export const EditRoleBinding = ({location, params, route}) => <Firehose kind={route.kind} name={params.name} namespace={params.ns}>
  <StatusBox>
    <EditBinding subjectIndex={location.query.subjectIndex} titleVerb="Edit" />
  </StatusBox>
</Firehose>;

export const CopyRoleBinding = ({location, params, route}) => <Firehose kind={route.kind} name={params.name} namespace={params.ns}>
  <StatusBox>
    <BaseEditRoleBinding isCreate={true} subjectIndex={location.query.subjectIndex} titleVerb="Duplicate" />
  </StatusBox>
</Firehose>;

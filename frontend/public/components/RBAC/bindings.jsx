import React from 'react';
import Helmet from 'react-helmet';
import { Link } from 'react-router';

import { k8s, k8sCreate } from '../../module/k8s';
import { getNamespacedRoute } from '../../ui/ui-actions';
import { MultiListPage, List } from '../factory';
import { RadioGroup } from '../modals/_radio';
import { confirmModal } from '../modals';
import { SafetyFirst } from '../safety-first';
import { ButtonBar, Cog, Dropdown, ErrorMessage, history, kindObj, LoadingInline, MsgBox, MultiFirehose, ResourceCog, ResourceIcon, ResourceLink } from '../utils';
import { isSystemRole } from './index';

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

const BindingsList = props => <List {...props} EmptyMsg={EmptyMsg} Header={Header} Row={BindingRows(SubjectRow)} />;

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

export const RoleBindingsPage = () => <MultiListPage
  ListComponent={BindingsList}
  canCreate={true}
  createButtonText="Create Binding"
  createProps={{to: 'rolebindings/new'}}
  filterLabel="Role Bindings by role or subject"
  resources={resources}
  rowFilters={filters}
  rowSplitter={rowSplitter}
  textFilter="role-binding"
  title="Role Bindings"
/>;

const ListDropdown_ = ({desc, loaded, loadError, onChange, placeholder, resources, selectedKey}) => {
  let items, title, newOnChange;
  if (loadError) {
    title = <div className="cos-error-title">Error Loading {desc}</div>;
  } else if (!loaded) {
    title = <LoadingInline />;
  } else {
    const resourceNameKindMap = ({data, kind}) => _.reject(data, isSystemRole).map(d => ({[d.metadata.name]: kind}));
    const nameKindMap = Object.assign({}, ..._.flatMap(resources, resourceNameKindMap));
    items = _.mapValues(nameKindMap, (kind, name) => <span><ResourceIcon kind={kind} /> {name}</span>);
    title = items[selectedKey] || <span className="text-muted">{placeholder}</span>;

    // Pass both the resource name and the resource kind to onChange()
    newOnChange = key => onChange(key, nameKindMap[key]);
  }
  return <div>
    <Dropdown items={items} title={title} onChange={newOnChange} />
    {loaded && _.isEmpty(items) && <p className="alert alert-info">No {desc} found or defined.</p>}
  </div>;
};

const ListDropdown = props => <MultiFirehose resources={props.kinds.map(kind => ({kind, isList: true, prop: kind}))}>
  <ListDropdown_ {...props} />
</MultiFirehose>;

const NsDropdown = props => <ListDropdown {...props} desc="Namespaces" kinds={['namespace']} placeholder="Select namespace" />;

const NsRoleDropdown = props => <ListDropdown {...props} desc="Namespace Roles (Role)" kinds={['role', 'clusterrole']} placeholder="Select role name" />;

const ClusterRoleDropdown = props => <ListDropdown {...props} desc="Cluster-wide Roles (ClusterRole)" kinds={['clusterrole']} placeholder="Select role name" />;

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

export class CreateRoleBinding extends SafetyFirst {
  constructor (props) {
    super(props);
    this.state = {
      inProgress: false,
      kind: 'RoleBinding',
      name: '',
      namespace: props.params.ns,
      subjectKind: 'User',
      subjectName: '',
    };
    this.changeKind = e => this.setState({kind: e.target.value});
    this.changeName = e => this.setState({name: e.target.value});
    this.changeNamespace = namespace => this.setState({namespace});
    this.changeRole = (roleName, kind) => {
      const roleKind = ({role: 'Role', clusterrole: 'ClusterRole'})[kind];
      this.setState({roleName, roleKind});
    };
    this.changeSubjectKind = e => this.setState({subjectKind: e.target.value});
    this.changeSubjectName = e => this.setState({subjectName: e.target.value});
    this.save = this.save.bind(this);
  }

  save () {
    const {kind, name, roleName, roleKind, subjectKind, subjectName} = this.state;
    const namespace = kind === 'RoleBinding' ? this.state.namespace : undefined;

    if (!kind || !name || !roleName || !roleKind || !subjectKind || !subjectName || (kind === 'RoleBinding' && !namespace)) {
      this.setState({error: 'Please complete all fields.'});
      return;
    }

    this.setState({inProgress: true});
    k8sCreate(kindObj(kind), {
      apiVersion: 'rbac.authorization.k8s.io/v1beta1',
      kind,
      metadata: {
        name,
        namespace,
      },
      roleRef: {
        kind: roleKind,
        name: roleName,
        apiGroup: 'rbac.authorization.k8s.io',
      },
      subjects: [{
        kind: subjectKind,
        name: subjectName,
        apiGroup: 'rbac.authorization.k8s.io',
      }],
    }).then(
      () => {
        this.setState({inProgress: false});
        history.push(getNamespacedRoute('rolebindings'));
      },
      e => this.setState({error: e.message, inProgress: false})
    );
  }

  render () {
    const {error, kind, name, namespace, roleName, subjectKind, subjectName} = this.state;
    const RoleDropdown = kind === 'RoleBinding' ? NsRoleDropdown : ClusterRoleDropdown;

    return <div className="rbac-new-binding co-m-pane__body">
      <Helmet title="Create Role Binding" />
      <div className="co-m-pane__body-group">
        <h1 className="co-m-pane__title">Create Role Binding</h1>
        <div className="co-m-pane__explanation">Associate a user/group to the selected role to define the type of access and resources that are allowed.</div>

        <RadioGroup currentValue={kind} items={bindingKinds} onChange={this.changeKind} />

        <div className="separator"></div>

        <Section label="Role Binding">
          Name:
          <input className="form-control" type="text" onChange={this.changeName} placeholder="Role binding name" value={name} />
          {kind === 'RoleBinding' && <div>
            <div className="separator"></div>
            Namespace:
            <NsDropdown selectedKey={namespace} onChange={this.changeNamespace} />
          </div>}
        </Section>

        <div className="separator"></div>

        <Section label="Role">
          Role Name:
          <RoleDropdown selectedKey={roleName} onChange={this.changeRole} />
        </Section>

        <div className="separator"></div>

        <Section label="Subject">
          <RadioGroup currentValue={subjectKind} items={subjectKinds} onChange={this.changeSubjectKind} />
          <div className="separator"></div>
          Subject Name:
          <input className="form-control" type="text" onChange={this.changeSubjectName} placeholder="Subject name" value={subjectName} />
        </Section>

        <div className="separator"></div>

        <ButtonBar inProgress={this.state.inProgress}>
          {error && <ErrorMessage errorMessage={error} />}
          <button type="submit" className="btn btn-primary" onClick={this.save}>Create Binding</button>
          <Link to={getNamespacedRoute('rolebindings')}>Cancel</Link>
        </ButtonBar>
      </div>
    </div>;
  }
}

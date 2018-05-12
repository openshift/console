import * as _ from 'lodash-es';
import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as PropTypes from 'prop-types';

import { getQN, k8sCreate, k8sPatch } from '../../module/k8s';
import { getActiveNamespace, formatNamespacedRouteForResource, UIActions } from '../../ui/ui-actions';
import { ColHead, List, ListHeader, MultiListPage, ResourceRow } from '../factory';
import { RadioGroup } from '../radio';
import { confirmModal } from '../modals';
import { SafetyFirst } from '../safety-first';
import { ButtonBar, Cog, Dropdown, Firehose, history, kindObj, LoadingInline, MsgBox,
  OverflowYFade, ResourceCog, ResourceName, ResourceLink,
  resourceObjPath, StatusBox, getQueryArgument } from '../utils';
import { isSystemRole } from './index';
import { registerTemplate } from '../../yaml-templates';

registerTemplate('rbac.authorization.k8s.io/v1beta1.RoleBinding', `apiVersion: rbac.authorization.k8s.io/v1beta1
kind: RoleBinding
metadata:
  name: example
subjects:
- kind: Group
  name: "my-sample-group"
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io`);


const bindingKind = binding => binding.metadata.namespace ? 'RoleBinding' : 'ClusterRoleBinding';

// Split each binding into one row per subject
export const flatten = resources => _.flatMap(resources, resource => {
  const ret = [];

  _.each(resource.data, binding => {
    if (!binding) {
      return undefined;
    }
    if (_.isEmpty(binding.subjects)) {
      const subject = {kind: '-', name: '-'};
      return ret.push(Object.assign({}, binding, {subject}));
    }
    _.each(binding.subjects, (subject, subjectIndex) => {
      ret.push(Object.assign({}, binding, {
        subject,
        subjectIndex,
        rowKey: `${getQN(binding)}|${subject.kind}|${subject.name}`,
      }));
    });
  });

  return ret;
});

const menuActions = ({subjectIndex, subjects}, startImpersonate) => {
  const subject = subjects[subjectIndex];

  const actions = [
    (kind, obj) => ({
      label: `Duplicate ${kind.label}...`,
      href: `${resourceObjPath(obj, kind.kind)}/copy?subjectIndex=${subjectIndex}`,
    }),
    (kind, obj) => ({
      label: `Edit ${kind.label} Subject...`,
      href: `${resourceObjPath(obj, kind.kind)}/edit?subjectIndex=${subjectIndex}`,
    }),
    subjects.length === 1 ? Cog.factory.Delete : (kind, binding) => ({
      label: `Delete ${kind.label} Subject...`,
      callback: () => confirmModal({
        title: `Delete ${kind.label} Subject`,
        message: `Are you sure you want to delete subject ${subject.name} of type ${subject.kind}?`,
        btnText: 'Delete Subject',
        executeFn: () => k8sPatch(kind, binding, [{op: 'remove', path: `/subjects/${subjectIndex}`}]),
      }),
    }),
  ];

  if (subject.kind === 'User' || subject.kind === 'Group') {
    actions.unshift(() => ({
      label: `Impersonate ${subject.kind} "${subject.name}"...`,
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
    <ColHead {...props} className="col-md-3 hidden-sm hidden-xs" sortField="subject.kind">Subject Kind</ColHead>
    <ColHead {...props} className="col-md-5 col-xs-7" sortField="subject.name">Subject Name</ColHead>
    <ColHead {...props} className="col-md-4 col-xs-5" sortField="metadata.namespace">Namespace</ColHead>
  </div>
</ListHeader>;

export const BindingName = connect(null, {startImpersonate: UIActions.startImpersonate})(
  ({binding, startImpersonate}) => <span>
    {binding.subjects &&
      <ResourceCog actions={menuActions(binding, startImpersonate)} kind={bindingKind(binding)} resource={binding} />}
    <ResourceLink kind={bindingKind(binding)} name={binding.metadata.name} namespace={binding.metadata.namespace} />
  </span>);

export const RoleLink = ({binding}) => {
  const kind = binding.roleRef.kind;

  // Cluster Roles have no namespace and for Roles, the Role's namespace matches the Role Binding's namespace
  const ns = kind === 'ClusterRole' ? undefined : binding.metadata.namespace;
  return <ResourceLink kind={kind} name={binding.roleRef.name} namespace={ns} />;
};

const Row = ({obj: binding}) => <ResourceRow obj={binding}>
  <div className="col-xs-3">
    <BindingName binding={binding} />
  </div>
  <OverflowYFade className="col-xs-3">
    <RoleLink binding={binding} />
  </OverflowYFade>
  <div className="col-xs-6">
    <OverflowYFade className="col-md-3 hidden-sm hidden-xs">
      {binding.subject.kind}
    </OverflowYFade>
    <OverflowYFade className="col-md-5 col-xs-7">
      {binding.subject.name}
    </OverflowYFade>
    <OverflowYFade className="col-md-4 col-sm-5 col-xs-5">
      {binding.metadata.namespace ? <ResourceLink kind="Namespace" name={binding.metadata.namespace} /> : 'all'}
    </OverflowYFade>
  </div>
</ResourceRow>;

const EmptyMsg = () => <MsgBox title="No Role Bindings Found" detail="Roles grant access to types of objects in the cluster. Roles are applied to a group or user via a Role Binding." />;

export const BindingsList = props => <List {...props} EmptyMsg={EmptyMsg} Header={Header} Row={Row} />;

export const bindingType = binding => {
  if (!binding) {
    return undefined;
  }
  if (binding.roleRef.name.startsWith('system:')) {
    return 'system';
  }
  return binding.metadata.namespace ? 'namespace' : 'cluster';
};

const roleResources = [
  {kind: 'RoleBinding', namespaced: true},
  {kind: 'ClusterRoleBinding', namespaced: false, optional: true},
];

export const RoleBindingsPage = ({namespace, showTitle=true}) => <MultiListPage
  ListComponent={BindingsList}
  canCreate={true}
  createButtonText="Create Binding"
  createProps={{to: '/k8s/cluster/rolebindings/new'}}
  filterLabel="Role Bindings by role or subject"
  resources={roleResources}
  rowFilters={[{
    type: 'role-binding-kind',
    selected: ['cluster', 'namespace'],
    reducer: bindingType,
    items: ({ClusterRoleBinding: data}) => {
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
  namespace={namespace}
  flatten={flatten}
  textFilter="role-binding"
  title="Role Bindings"
  showTitle={showTitle}
/>;

class ListDropdown_ extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      items: {},
    };

    if (props.selectedKey) {
      this.state.selectedKey = props.selectedKeyKind ? `${props.selectedKey}-${props.selectedKeyKind}` : props.selectedKey;
    }

    this.state.title = props.loaded ? <span className="text-muted">{props.placeholder}</span> : <LoadingInline />;

    this.autocompleteFilter = (text, item) => fuzzy(text, item.props.name);
    // Pass both the resource name and the resource kind to onChange()
    this.onChange = key => {
      const {name, kindLabel} = _.get(this.state, ['items', key], {});
      this.setState({selectedKey: key, title: <ResourceName kind={kindLabel} name={name} />});
      this.props.onChange(name, kindLabel);
    };
  }

  componentWillMount () {
    // we need to trigger state changes to get past shouldComponentUpdate...
    //   but the entire working set of data can be loaded in memory at this point in time
    //   in which case componentWillReceiveProps would not be called for a while...
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps (nextProps) {
    const {loaded, loadError} = nextProps;

    if (loadError) {
      this.setState({
        title: <div className="cos-error-title">Error Loading {nextProps.desc}</div>
      });
      return;
    }

    if (!loaded) {
      return;
    }

    const state = {};

    const { resources, dataFilter } = nextProps;
    state.items = {};
    _.each(resources, ({data}, kindLabel) => {
      _.reduce(data, (acc, resource) => {
        if (!dataFilter || dataFilter(resource)) {
          acc[`${resource.metadata.name}-${kindLabel}`] = {kindLabel, name: resource.metadata.name};
        }
        return acc;
      }, state.items);
    });

    const { selectedKey } = this.state;
    // did we switch from !loaded -> loaded ?
    if (!this.props.loaded && !selectedKey) {
      state.title = <span className="text-muted">{nextProps.placeholder}</span>;
    }

    if (selectedKey) {
      const item = state.items[selectedKey];
      // item may not exist if selectedKey is a role and then user switches to creating a ClusterRoleBinding
      if (item) {
        state.title = <ResourceName kind={item.kindLabel} name={item.name} />;
      }
    }

    this.setState(state);
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (_.isEqual(this.state, nextState)) {
      return false;
    }
    return true;
  }

  render () {
    const {desc, fixed, placeholder, id, loaded} = this.props;
    const items = {};

    _.each(this.state.items, (v, key) => items[key] = <ResourceName kind={v.kindLabel} name={v.name} />);

    const {selectedKey} = this.state;

    const Component = fixed
      ? items[selectedKey]
      : <Dropdown autocompleteFilter={this.autocompleteFilter} autocompletePlaceholder={placeholder} items={items}
        selectedKey={selectedKey} title={this.state.title} onChange={this.onChange} id={id} />;

    return <div>
      { Component }
      { loaded && _.isEmpty(items) && <p className="alert alert-info"><span className="pficon pficon-info"></span>No {desc} found or defined.</p> }
    </div>;
  }
}

const ListDropdown = props => <Firehose resources={props.kinds.map(kind => ({kind, isList: true, prop: kind}))}>
  <ListDropdown_ {...props} />
</Firehose>;

ListDropdown.propTypes = {
  dataFilter: PropTypes.func,
  desc: PropTypes.string,
  // specify both key/kind
  selectedKey: PropTypes.string,
  selectedKeyKind: PropTypes.string,
  fixed: PropTypes.bool,
  kinds: PropTypes.arrayOf(PropTypes.string).isRequired,
  placeholder: PropTypes.string,
};

const NsDropdown = props => <ListDropdown {...props} desc="Namespaces" kinds={['Namespace']} selectedKeyKind="Namespace" placeholder="Select namespace" />;

const NsRoleDropdown = props => {
  const roleFilter = role => !isSystemRole(role) && (!props.namespace || !role.metadata.namespace || role.metadata.namespace === props.namespace);
  return <ListDropdown
    {...props}
    dataFilter={roleFilter}
    desc="Namespace Roles (Role)"
    kinds={props.fixed ? [props.selectedKeyKind] : ['Role', 'ClusterRole']}
    placeholder="Select role name"
  />;
};

const ClusterRoleDropdown = props => <ListDropdown
  {...props}
  dataFilter={role => !isSystemRole(role)}
  desc="Cluster-wide Roles (ClusterRole)"
  kinds={['ClusterRole']}
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

      const existingData = _.pick(props.obj, ['metadata.name', 'metadata.namespace', 'roleRef', 'subjects']);
      existingData.kind = props.kind;
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
      this.changeRoleRef = (name, kindId) => this.setData({roleRef: {name, kind: kindId}});
      this.changeSubjectKind = e => this.setSubject({kind: e.target.value});
      this.changeSubjectName = e => this.setSubject({name: e.target.value});
      this.changeSubjectNamespace = namespace => this.setSubject({namespace});
    }

    setKind (e) {
      const kind = e.target.value;
      const patch = {kind};
      if (kind === 'ClusterRoleBinding') {
        patch.metadata = {namespace: null};
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
          history.push(formatNamespacedRouteForResource('rolebindings'));
        },
        err => this.setState({error: err.message, inProgress: false})
      );
    }

    render () {
      const {kind, metadata, roleRef} = this.state.data;
      const subject = this.getSubject();
      const {fixed, saveButtonText} = this.props;
      const RoleDropdown = kind === 'RoleBinding' ? NsRoleDropdown : ClusterRoleDropdown;
      const title = `${this.props.titleVerb} ${kindObj(kind).label}`;

      return <div className="rbac-edit-binding co-m-pane__body">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <form className="co-m-pane__body-group" onSubmit={this.save}>
          <h1 className="co-m-pane__title">{title}</h1>
          <div className="co-m-pane__explanation">Associate a user/group to the selected role to define the type of access and resources that are allowed.</div>

          {!_.get(fixed, 'kind') && <RadioGroup currentValue={kind} items={bindingKinds} onChange={this.setKind} />}

          <div className="separator"></div>

          <Section label="Role Binding">
            <p className="rbac-edit-binding__input-label">Name:</p>
            {_.get(fixed, 'metadata.name')
              ? <ResourceName kind={kind} name={metadata.name} />
              : <input className="form-control" type="text" onChange={this.changeName} placeholder="Role binding name" value={metadata.name} required id="test––role-binding-name" />}
            {kind === 'RoleBinding' && <div>
              <div className="separator"></div>
              <p className="rbac-edit-binding__input-label">Namespace:</p>
              <NsDropdown fixed={!!_.get(fixed, 'metadata.namespace')} selectedKey={metadata.namespace} onChange={this.changeNamespace} id="test--ns-dropdown" />
            </div>}
          </Section>

          <div className="separator"></div>

          <Section label="Role">
            <p className="rbac-edit-binding__input-label">Role Name:</p>
            <RoleDropdown
              fixed={!!_.get(fixed, 'roleRef.name')}
              namespace={metadata.namespace}
              onChange={this.changeRoleRef}
              selectedKey={_.get(fixed, 'roleRef.name') || roleRef.name}
              selectedKeyKind={_.get(fixed, 'roleRef.kind') || roleRef.kind}
              id="test--role-dropdown"
            />
          </Section>

          <div className="separator"></div>

          <Section label="Subject">
            <RadioGroup currentValue={subject.kind} items={subjectKinds} onChange={this.changeSubjectKind} />
            {subject.kind === 'ServiceAccount' && <div>
              <div className="separator"></div>
              <p className="rbac-edit-binding__input-label">Subject Namespace:</p>
              <NsDropdown selectedKey={subject.namespace} onChange={this.changeSubjectNamespace} id="test--subject-ns-dropdown" />
            </div>}
            <div className="separator"></div>
            <p className="rbac-edit-binding__input-label">Subject Name:</p>
            <input className="form-control" type="text" onChange={this.changeSubjectName} placeholder="Subject name" value={subject.name} required id="test--subject-name" />
          </Section>

          <div className="separator"></div>

          <ButtonBar errorMessage={this.state.error} inProgress={this.state.inProgress}>
            <button type="submit" className="btn btn-primary" id="yaml-create">{saveButtonText || 'Create Binding'}</button>
            <Link to={formatNamespacedRouteForResource('rolebindings')} className="btn btn-default">Cancel</Link>
          </ButtonBar>
        </form>
      </div>;
    }
  });

export const CreateRoleBinding = ({match: {params}}) => <BaseEditRoleBinding
  metadata={{
    namespace: getActiveNamespace(),
  }}
  fixed={{
    kind: (params.ns || params.rolekind === 'Role') ? 'RoleBinding' : undefined,
    metadata: {namespace: params.ns},
    roleRef: {kind: params.rolekind, name: params.rolename},
  }}
  isCreate={true}
  titleVerb="Create"
/>;

const getSubjectIndex = () => {
  const subjectIndex = getQueryArgument('subjectIndex') || '0';
  return parseInt(subjectIndex, 10);
};

const BindingLoadingWrapper = props => {
  const fixed = {};
  _.each(props.fixedKeys, k => fixed[k] = _.get(props.obj.data, k));
  return <StatusBox {...props.obj}>
    <BaseEditRoleBinding {...props} obj={props.obj.data} fixed={fixed} />
  </StatusBox>;
};

export const EditRoleBinding = ({match: {params}, kind}) => <Firehose resources={[{kind: kind, name: params.name, namespace: params.ns, isList: false, prop: 'obj'}]}>
  <BindingLoadingWrapper fixedKeys={['kind', 'metadata', 'roleRef']} subjectIndex={getSubjectIndex()} titleVerb="Edit" saveButtonText="Save Binding" />
</Firehose>;

export const CopyRoleBinding = ({match: {params}, kind}) => <Firehose resources={[{kind: kind, name: params.name, namespace: params.ns, isList: false, prop: 'obj'}]}>
  <BindingLoadingWrapper isCreate={true} subjectIndex={getSubjectIndex()} titleVerb="Duplicate" />
</Firehose>;

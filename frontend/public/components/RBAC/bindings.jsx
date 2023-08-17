import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { ActionGroup, Button } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import { ListPageBody } from '@console/dynamic-plugin-sdk';
import { FLAGS } from '@console/shared/src/constants';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { ClusterRoleBindingModel } from '../../models';
import { getQN, k8sCreate, k8sPatch, referenceFor } from '../../module/k8s';
import * as UIActions from '../../actions/ui';
import { Table, TableData } from '../factory';
import ListPageFilter from '../factory/ListPage/ListPageFilter';
import ListPageHeader from '../factory/ListPage/ListPageHeader';
import { useListPageFilter } from '../factory/ListPage/filter-hook';
import { ListPageCreateLink } from '../factory/ListPage/ListPageCreate';
import { RadioGroup } from '../radio';
import { confirmModal } from '../modals';
import {
  ButtonBar,
  Firehose,
  getQueryArgument,
  history,
  Kebab,
  kindObj,
  ListDropdown,
  MsgBox,
  NsDropdown,
  PageHeading,
  ResourceKebab,
  ResourceLink,
  ResourceName,
  resourceObjPath,
  StatusBox,
  useAccessReview,
} from '../utils';
import { connectToFlags } from '../../reducers/connectToFlags';
import { flagPending } from '../../reducers/features';
import { useTranslation, withTranslation } from 'react-i18next';
import i18next from 'i18next';
import { useK8sWatchResources } from '../utils/k8s-watch-hook';

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

const getKindLabel = (kind) => (kind.labelKey ? i18next.t(kind.labelKey) : kind.label);

const menuActions = ({ subjectIndex, subjects }, startImpersonate) => {
  const subject = subjects[subjectIndex];

  const actions = [
    (kind, obj) => ({
      label: i18next.t('public~Duplicate {{kindLabel}}', {
        kindLabel: getKindLabel(kind),
      }),
      href: `${decodeURIComponent(
        resourceObjPath(obj, kind.kind),
      )}/copy?subjectIndex=${subjectIndex}`,
      // Only perform access checks when duplicating cluster role bindings.
      // It's not practical to check namespace role bindings since we don't know what namespace the user will pick in the form.
      accessReview: _.get(obj, 'metadata.namespace')
        ? null
        : {
            group: kind.apiGroup,
            resource: kind.plural,
            verb: 'create',
          },
    }),
    (kind, obj) => ({
      label: i18next.t('public~Edit {{kindLabel}} subject', {
        kindLabel: getKindLabel(kind),
      }),
      href: `${decodeURIComponent(
        resourceObjPath(obj, kind.kind),
      )}/edit?subjectIndex=${subjectIndex}`,
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
          label: i18next.t('public~Delete {{label}} subject', kind),
          callback: () =>
            confirmModal({
              title: i18next.t('public~Delete {{label}} subject', kind),
              message: i18next.t(
                'public~Are you sure you want to delete subject {{name}} of type {{kind}}?',
                subject,
              ),
              btnText: i18next.t('public~Delete subject'),
              executeFn: () =>
                k8sPatch(kind, binding, [
                  {
                    op: 'remove',
                    path: `/subjects/${subjectIndex}`,
                  },
                ]),
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
      label: i18next.t('public~Impersonate {{kind}} "{{name}}"', subject),
      callback: () => startImpersonate(subject.kind, subject.name),
    }));
  }

  return actions;
};

const tableColumnClasses = [
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-xl',
  '',
  Kebab.columnClass,
];

const RoleBindingsTableHeader = () => {
  return [
    {
      title: i18next.t('public~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: i18next.t('public~Role ref'),
      sortField: 'roleRef.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: i18next.t('public~Subject kind'),
      sortField: 'subject.kind',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: i18next.t('public~Subject name'),
      sortField: 'subject.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: i18next.t('public~Namespace'),
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

export const BindingName = ({ binding }) => (
  <ResourceLink
    kind={bindingKind(binding)}
    name={binding.metadata.name}
    namespace={binding.metadata.namespace}
  />
);

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

const RoleBindingsTableRow = ({ obj: binding }) => {
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <BindingName binding={binding} />
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
          i18next.t('public~All namespaces')
        )}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <BindingKebab binding={binding} />
      </TableData>
    </>
  );
};

const EmptyMsg = () => {
  const { t } = useTranslation();
  return (
    <MsgBox
      title={t('public~No RoleBindings found')}
      detail={t(
        'public~Roles grant access to types of objects in the cluster. Roles are applied to a group or user via a RoleBinding.',
      )}
    />
  );
};

export const BindingsList = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      aria-label={t('public~RoleBindings')}
      EmptyMsg={EmptyMsg}
      Header={RoleBindingsTableHeader}
      Row={RoleBindingsTableRow}
      virtualize
      {...props}
    />
  );
};

export const bindingType = (binding) => {
  if (!binding) {
    return undefined;
  }
  if (binding.roleRef.name.startsWith('system:')) {
    return 'system';
  }
  return binding.metadata.namespace ? 'namespace' : 'cluster';
};

export const RoleBindingsPage = ({
  namespace = undefined,
  showTitle = true,
  mock = false,
  staticFilters,
  name,
  kind,
  createPath = `/k8s/cluster/rolebindings/~new${
    name && kind ? `?subjectName=${encodeURIComponent(name)}&subjectKind=${kind}` : ''
  }`,
  hideLabelFilter = false,
  hideNameLabelFilters = false,
  hideColumnManagement = false,
}) => {
  const { t } = useTranslation();
  const resources = useK8sWatchResources({
    RoleBinding: {
      kind: 'RoleBinding',
      namespaced: true,
      namespace,
      isList: true,
    },
    ClusterRoleBinding: {
      kind: 'ClusterRoleBinding',
      namespaced: false,
      isList: true,
    },
  });

  const data = React.useMemo(() => flatten(resources), [resources]);

  const loaded = Object.values(resources)
    .filter((r) => !r.loadError)
    .every((r) => r.loaded);

  const hasCRBindings =
    resources.ClusterRoleBinding.data?.length > 0 &&
    resources.ClusterRoleBinding.loaded &&
    !resources.ClusterRoleBinding.loadError;

  const rowFilters = React.useMemo(
    () => [
      {
        filterGroupName: t('public~Kind'),
        type: 'role-binding-kind',
        reducer: bindingType,
        filter: (filter, binding) =>
          filter.selected?.includes(bindingType(binding)) || !filter.selected?.length,
        items: hasCRBindings
          ? [
              {
                id: 'cluster',
                title: t('public~Cluster-wide RoleBindings'),
              },
              { id: 'namespace', title: t('public~Namespace RoleBindings') },
              { id: 'system', title: t('public~System RoleBindings') },
            ]
          : [
              { id: 'namespace', title: t('public~Namespace RoleBindings') },
              { id: 'system', title: t('public~System RoleBindings') },
            ],
      },
    ],
    [hasCRBindings, t],
  );

  const [staticData, filteredData, onFilterChange] = useListPageFilter(
    data,
    rowFilters,
    staticFilters,
  );

  return (
    <>
      <ListPageHeader title={showTitle ? t('public~RoleBindings') : undefined}>
        {!mock && (
          <ListPageCreateLink to={createPath}>{t('public~Create binding')}</ListPageCreateLink>
        )}
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter
          data={staticData}
          loaded={loaded}
          rowFilters={rowFilters}
          onFilterChange={onFilterChange}
          hideNameLabelFilters={hideNameLabelFilters}
          hideLabelFilter={hideLabelFilter}
          hideColumnManagement={hideColumnManagement}
        />
        <BindingsList
          data={filteredData}
          loaded={loaded}
          loadError={resources.RoleBinding.loadError}
          mock={mock}
        />
      </ListPageBody>
    </>
  );
};

const NsRoleDropdown_ = (props) => {
  const openshiftFlag = props.flags[FLAGS.OPENSHIFT];
  if (flagPending(openshiftFlag)) {
    return null;
  }

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
  const { t } = props;

  return (
    <ListDropdown
      {...props}
      desc={t('public~Namespace roles (Role)')}
      resources={resources}
      placeholder={t('public~Select role name')}
    />
  );
};

const NsRoleDropdown = connectToFlags(FLAGS.OPENSHIFT)(withTranslation()(NsRoleDropdown_));

const ClusterRoleDropdown = (props) => {
  const { t } = useTranslation();
  return (
    <ListDropdown
      {...props}
      desc={t('public~Cluster-wide roles (ClusterRole)')}
      resources={[{ kind: 'ClusterRole' }]}
      placeholder={t('public~Select role name')}
    />
  );
};

const Section = ({ label, children }) => (
  <div>
    <div className="co-form-section__label">{label}</div>
    <div className="co-form-subsection">{children}</div>
  </div>
);

const BaseEditRoleBinding = (props) => {
  const { t } = useTranslation();

  const { fixed, saveButtonText } = props;

  const [data, setData] = React.useState({});
  const [inProgress, setInProgress] = React.useState(false);
  const [error, setError] = React.useState('');

  const subjectIndex = props.subjectIndex || 0;

  const existingData = _.pick(props.obj, [
    'metadata.name',
    'metadata.namespace',
    'roleRef',
    'subjects',
  ]);
  existingData.kind = props.kind;

  const { subjectKind, subjectName } = fixed.subjectRef || {};

  // constructor/didmount
  React.useEffect(() => {
    const obj = _.defaultsDeep({}, fixed, existingData, {
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
          kind: subjectKind || 'User',
          name: subjectName || '',
          apiGroup:
            subjectKind === 'ServiceAccount' || !subjectKind ? '' : 'rbac.authorization.k8s.io',
        },
      ],
    });
    setData(obj);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSubject = () => {
    return _.get(data, `subjects[${subjectIndex}]`);
  };

  const setSubject = (patch) => {
    const { kind, name, namespace } = Object.assign({}, getSubject(), patch);
    const obj = Object.assign({}, data);
    obj.subjects[subjectIndex] =
      kind === 'ServiceAccount'
        ? { kind, name, namespace }
        : { apiGroup: 'rbac.authorization.k8s.io', kind, name };
    setData(obj);
  };

  // substituting this.setData
  const updateData = (patch) => {
    setData((previous) => _.defaultsDeep({}, patch, previous));
  };

  const changeName = (e) => {
    updateData({ metadata: { name: e.target.value } });
  };

  const changeNamespace = (namespace) => {
    updateData({ metadata: { namespace } });
  };

  const changeRoleRef = (name, kindId) => {
    updateData({ roleRef: { name, kind: kindId } });
  };

  const changeSubjectKind = (e) => {
    setSubject({ kind: e.target.value });
  };

  const changeSubjectName = (e) => {
    setSubject({ name: e.target.value });
  };

  const changeSubjectNamespace = (namespace) => {
    setSubject({ namespace });
  };

  const setKind = (e) => {
    const kind = e.target.value;
    const patch = { kind };
    if (kind === 'ClusterRoleBinding') {
      patch.metadata = { namespace: null };
    }
    updateData(patch);
  };

  const subject = getSubject();

  const save = (e) => {
    e.preventDefault();

    const { kind, metadata, roleRef } = data;

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
      setError(t('public~Please complete all fields.'));
      return;
    }

    setInProgress(true);

    const ko = kindObj(kind);
    (props.isCreate
      ? k8sCreate(ko, data)
      : k8sPatch(ko, { metadata }, [
          {
            op: 'replace',
            path: `/subjects/${subjectIndex}`,
            value: subject,
          },
        ])
    ).then(
      (obj) => {
        setInProgress(false);
        if (metadata.namespace) {
          props.setActiveNamespace(metadata.namespace);
        }
        history.push(resourceObjPath(obj, referenceFor(obj)));
      },
      (err) => {
        setError(err.message);
        setInProgress(false);
      },
    );
  };

  const RoleDropdown = data.kind === 'RoleBinding' ? NsRoleDropdown : ClusterRoleDropdown;

  const title = `${props.titleVerbAndKind}`;

  const isSubjectDisabled = fixed?.subjectRef?.subjectName ? true : false;

  const bindingKinds = [
    {
      value: 'RoleBinding',
      title: t('public~Namespace role binding (RoleBinding)'),
      desc: t(
        'public~Grant the permissions to a user or set of users within the selected namespace.',
      ),
    },
    {
      value: 'ClusterRoleBinding',
      title: t('public~Cluster-wide role binding (ClusterRoleBinding)'),
      desc: t(
        'public~Grant the permissions to a user or set of users at the cluster level and in all namespaces.',
      ),
    },
  ];

  const subjectKinds = [
    { value: 'User', title: t('public~User'), disabled: false },
    { value: 'Group', title: t('public~Group'), disabled: false },
    {
      value: 'ServiceAccount',
      title: t('public~ServiceAccount'),
      disabled: false,
    },
  ];

  return (
    <div className="co-m-pane__form">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading
        title={<div data-test="title">{title}</div>}
        helpText={t(
          'public~Associate a user/group to the selected role to define the type of access and resources that are allowed.',
        )}
      />
      <div className="co-m-pane__body">
        <form className="co-m-pane__body-group" onSubmit={save}>
          {!_.get(fixed, 'kind') && (
            <Section label={t('public~Binding type')}>
              <RadioGroup currentValue={data?.kind} items={bindingKinds} onChange={setKind} />
            </Section>
          )}

          <div className="co-form-section__separator" />

          <Section label={t('public~RoleBinding')}>
            <div className="form-group">
              <label htmlFor="role-binding-name" className="co-required">
                {t('public~Name')}
              </label>
              {_.get(fixed, 'metadata.name') ? (
                <ResourceName kind={data?.kind} name={data?.metadata?.name} />
              ) : (
                <input
                  className="pf-c-form-control"
                  type="text"
                  onChange={changeName}
                  placeholder={t('public~RoleBinding name')}
                  value={data?.metadata?.name}
                  required
                  id="role-binding-name"
                  data-test="role-binding-name"
                />
              )}
            </div>
            {data?.kind === 'RoleBinding' && (
              <div className="form-group" data-test="namespace-dropdown">
                <label htmlFor="ns-dropdown" className="co-required">
                  {t('public~Namespace')}
                </label>
                <NsDropdown
                  fixed={!!_.get(fixed, 'metadata.namespace')}
                  selectedKey={data?.metadata?.namespace}
                  onChange={changeNamespace}
                  id="ns-dropdown"
                />
              </div>
            )}
          </Section>

          <div className="co-form-section__separator" />

          <Section label={t('public~Role')}>
            <div className="form-group" data-test="role-dropdown">
              <label htmlFor="role-dropdown" className="co-required">
                {t('public~Role name')}
              </label>
              <RoleDropdown
                fixed={!!_.get(fixed, 'roleRef.name')}
                namespace={data?.metadata?.namespace}
                onChange={changeRoleRef}
                selectedKey={_.get(fixed, 'roleRef.name') || data?.roleRef?.name}
                selectedKeyKind={_.get(fixed, 'roleRef.kind') || data?.roleRef?.kind}
                id="role-dropdown"
              />
            </div>
          </Section>

          <div className="co-form-section__separator" />

          <Section label={t('public~Subject')}>
            <div className="form-group">
              <RadioGroup
                currentValue={subject?.kind}
                items={subjectKinds.map((obj) => ({
                  ...obj,
                  disabled: isSubjectDisabled,
                }))}
                onChange={changeSubjectKind}
              />
            </div>
            {subject?.kind === 'ServiceAccount' && (
              <div className="form-group">
                <label htmlFor="subject-namespace" className="co-required">
                  {t('public~Subject namespace')}
                </label>
                <NsDropdown
                  id="subject-namespace"
                  selectedKey={subject?.namespace}
                  onChange={changeSubjectNamespace}
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="subject-name" className="co-required">
                {t('public~Subject name')}
              </label>
              <input
                className="pf-c-form-control"
                type="text"
                onChange={changeSubjectName}
                placeholder={t('public~Subject name')}
                value={subject?.name}
                required
                id="subject-name"
                disabled={isSubjectDisabled}
                data-test="subject-name"
              />
            </div>
          </Section>

          <div className="co-form-section__separator" />

          <ButtonBar errorMessage={error} inProgress={inProgress}>
            <ActionGroup className="pf-c-form">
              <Button type="submit" id="save-changes" variant="primary" data-test="save-changes">
                {saveButtonText || t('public~Create')}
              </Button>
              <Button onClick={history.goBack} id="cancel" variant="secondary">
                {t('public~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
    </div>
  );
};

export const CreateRoleBinding = ({ match: { params }, location }) => {
  const searchParams = new URLSearchParams(location.search);
  const roleKind = searchParams.get('rolekind');
  const roleName = searchParams.get('rolename');
  const subjectName = searchParams.get('subjectName');
  const subjectKind = searchParams.get('subjectKind');
  const [namespace, setActiveNamespace] = useActiveNamespace();
  const metadata = { namespace };
  const clusterAllowed = useAccessReview({
    group: ClusterRoleBindingModel.apiGroup,
    resource: ClusterRoleBindingModel.plural,
    verb: 'create',
  });
  const fixed = {
    kind: params.ns || roleKind === 'Role' || !clusterAllowed ? 'RoleBinding' : undefined,
    metadata: { namespace: params.ns },
    roleRef: { kind: roleKind, name: roleName },
    subjectRef: { subjectName, subjectKind },
  };
  const { t } = useTranslation();
  return (
    <BaseEditRoleBinding
      metadata={metadata}
      setActiveNamespace={setActiveNamespace}
      fixed={fixed}
      isCreate={true}
      titleVerbAndKind={t('public~Create RoleBinding')}
    />
  );
};

const getSubjectIndex = () => {
  const subjectIndex = getQueryArgument('subjectIndex') || '0';
  return parseInt(subjectIndex, 10);
};

const BindingLoadingWrapper = (props) => {
  const [, setActiveNamespace] = useActiveNamespace();
  const fixed = {};
  _.each(props.fixedKeys, (k) => (fixed[k] = _.get(props.obj.data, k)));
  return (
    <StatusBox {...props.obj}>
      <BaseEditRoleBinding
        {...props}
        obj={props.obj.data}
        setActiveNamespace={setActiveNamespace}
        fixed={fixed}
      />
    </StatusBox>
  );
};

export const EditRoleBinding = ({ match: { params }, kind }) => {
  const { t } = useTranslation();
  return (
    <Firehose
      resources={[{ kind, name: params.name, namespace: params.ns, isList: false, prop: 'obj' }]}
    >
      <BindingLoadingWrapper
        fixedKeys={['kind', 'metadata', 'roleRef']}
        subjectIndex={getSubjectIndex()}
        titleVerbAndKind={t('public~Edit RoleBinding')}
        saveButtonText={t('public~Save')}
      />
    </Firehose>
  );
};

export const CopyRoleBinding = ({ match: { params }, kind }) => {
  const { t } = useTranslation();
  return (
    <Firehose
      resources={[{ kind, name: params.name, namespace: params.ns, isList: false, prop: 'obj' }]}
    >
      <BindingLoadingWrapper
        isCreate={true}
        fixedKeys={['kind']}
        subjectIndex={getSubjectIndex()}
        titleVerbAndKind={t('public~Duplicate RoleBinding')}
      />
    </Firehose>
  );
};

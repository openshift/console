import * as _ from 'lodash-es';
import * as React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  FormSection,
  Radio,
  TextInput,
} from '@patternfly/react-core';
import { ListPageBody } from '@console/dynamic-plugin-sdk';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { FLAGS } from '@console/shared/src/constants';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { LazyActionMenu, useFlag, DASH } from '@console/shared';
import { ClusterRoleBindingModel } from '../../models';
import {
  ClusterRoleBindingKind,
  getQN,
  k8sCreate,
  k8sPatch,
  referenceFor,
  RoleBindingKind,
  Subject,
} from '../../module/k8s';
import { MultiListPageProps } from '../factory';
import ListPageHeader from '../factory/ListPage/ListPageHeader';
import { ListPageCreateLink } from '../factory/ListPage/ListPageCreate';
import {
  ConsoleDataView,
  initialFiltersDefault,
  getNameCellProps,
  actionsCellProps,
  cellIsStickyProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import { TableColumn } from '@console/internal/module/k8s';
import { GetDataViewRows, ResourceFilters } from '@console/app/src/components/data-view/types';
import { tableFilters } from '../factory/table-filters';
import {
  ButtonBar,
  Firehose,
  getQueryArgument,
  kindObj,
  ListDropdown,
  NsDropdown,
  ResourceLink,
  ResourceName,
  resourceObjPath,
  StatusBox,
  useAccessReview,
  ListDropdownProps,
  LoadingBox,
} from '../utils';
import { flagPending } from '../../reducers/features';
import { useK8sWatchResources } from '../utils/k8s-watch-hook';

// Split each binding into one row per subject
export const flatten = (resources): BindingKind[] =>
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

const tableColumnInfo = [
  { id: 'name' },
  { id: 'roleRef' },
  { id: 'subjectKind' },
  { id: 'subjectName' },
  { id: 'namespace' },
  { id: 'actions' },
];

const useRoleBindingsColumns = (): TableColumn<BindingKind>[] => {
  const { t } = useTranslation();
  return React.useMemo(
    () => [
      {
        title: t('public~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Role ref'),
        id: tableColumnInfo[1].id,
        sort: 'roleRef.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Subject kind'),
        id: tableColumnInfo[2].id,
        sort: 'subject.kind',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Subject name'),
        id: tableColumnInfo[3].id,
        sort: 'subject.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
        id: tableColumnInfo[4].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[5].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ],
    [t],
  );
};

export const BindingName: React.FCC<BindingProps> = ({ binding }) => (
  <ResourceLink
    kind={binding.kind}
    name={binding.metadata.name}
    namespace={binding.metadata.namespace}
  />
);

export const BindingKebab: React.FCC<BindingProps> = ({ binding }) => {
  const context = {
    [referenceFor(binding)]: binding,
  };

  return binding.subjects ? (
    // key ensures that the action menu is re-rendered when the binding changes
    <LazyActionMenu context={context} key={binding.metadata?.uid || binding.metadata?.name} />
  ) : null;
};

export const RoleLink: React.FCC<BindingProps> = ({ binding }) => {
  const kind = binding.roleRef.kind;

  // Cluster Roles have no namespace and for Roles, the Role's namespace matches the Role Binding's namespace
  const ns = kind === 'ClusterRole' ? undefined : binding.metadata.namespace;
  return <ResourceLink kind={kind} name={binding.roleRef.name} namespace={ns} />;
};

const bindingType = (binding: BindingKind) => {
  if (!binding) {
    return undefined;
  }
  if (binding.roleRef.name.startsWith('system:')) {
    return 'system';
  }
  return binding.metadata.namespace ? 'namespace' : 'cluster';
};

const getDataViewRows: GetDataViewRows<BindingKind, undefined> = (data, columns) => {
  return data.map(({ obj: binding }) => {
    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <BindingName binding={binding} />,
        props: getNameCellProps(binding.metadata.name),
      },
      [tableColumnInfo[1].id]: {
        cell: <RoleLink binding={binding} />,
      },
      [tableColumnInfo[2].id]: {
        cell: binding.subject.kind,
      },
      [tableColumnInfo[3].id]: {
        cell: binding.subject.name,
      },
      [tableColumnInfo[4].id]: {
        cell: binding.metadata.namespace ? (
          <ResourceLink kind="Namespace" name={binding.metadata.namespace} />
        ) : (
          i18next.t('public~All namespaces')
        ),
      },
      [tableColumnInfo[5].id]: {
        cell: <BindingKebab binding={binding} />,
        props: {
          ...actionsCellProps,
        },
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      const props = rowCells[id]?.props || undefined;
      return {
        id,
        props,
        cell,
      };
    });
  });
};

export const BindingsList: React.FCC<BindingsListTableProps> = (props) => {
  const { t } = useTranslation();
  const columns = useRoleBindingsColumns();

  const hasCRBindings = props.data.some((binding) => !binding.metadata.namespace);

  const kindFilterOptions = React.useMemo(() => {
    // Calculate counts for each binding type
    const counts = props.data.reduce((acc, binding) => {
      const type = bindingType(binding);
      if (type) {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const options = hasCRBindings
      ? [
          {
            value: 'cluster',
            label: `${t('public~Cluster-wide RoleBindings')} (${counts.cluster || 0})`,
          },
          {
            value: 'namespace',
            label: `${t('public~Namespace RoleBindings')} (${counts.namespace || 0})`,
          },
          {
            value: 'system',
            label: `${t('public~System RoleBindings')} (${counts.system || 0})`,
          },
        ]
      : [
          {
            value: 'namespace',
            label: `${t('public~Namespace RoleBindings')} (${counts.namespace || 0})`,
          },
          {
            value: 'system',
            label: `${t('public~System RoleBindings')} (${counts.system || 0})`,
          },
        ];
    return options;
  }, [hasCRBindings, props.data, t]);

  const additionalFilterNodes = React.useMemo<React.ReactNode[]>(
    () => [
      <DataViewCheckboxFilter
        key="role-kind"
        filterId="role-kind"
        title={t('public~Kind')}
        placeholder={t('public~Filter by kind')}
        options={kindFilterOptions}
      />,
    ],
    [kindFilterOptions, t],
  );

  const matchesAdditionalFilters = React.useCallback(
    (binding: BindingKind, filters: BindingFilters) =>
      !filters['role-kind'] ||
      filters['role-kind'].length === 0 ||
      filters['role-kind'].includes(bindingType(binding)),
    [],
  );

  const { data, loaded, staticFilters } = props;

  // Apply staticFilters to filter the data using table filters
  const filteredData = React.useMemo(() => {
    if (!staticFilters || !data) {
      return data;
    }

    const filtersMap = tableFilters(false); // false for fuzzy search

    return data.filter((binding) => {
      return staticFilters.every((filter) => {
        const filterKey = Object.keys(filter)[0];
        const filterValue = filter[filterKey];

        // Use the table filter function if it exists
        if (filtersMap[filterKey]) {
          return filtersMap[filterKey](filterValue, binding);
        }
      });
    });
  }, [data, staticFilters]);

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<BindingKind, undefined, BindingFilters>
        {...props}
        data={filteredData}
        loaded={loaded}
        label={t('public~RoleBindings')}
        columns={columns}
        initialFilters={{ ...initialFiltersDefault, 'role-kind': [] }}
        additionalFilterNodes={additionalFilterNodes}
        matchesAdditionalFilters={matchesAdditionalFilters}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

export const RoleBindingsPage: React.FCC<RoleBindingsPageProps> = ({
  namespace = undefined,
  showTitle = true,
  mock = false,
  staticFilters,
  name,
  kind,
  createPath = `/k8s/cluster/rolebindings/~new${
    name && kind ? `?subjectName=${encodeURIComponent(name)}&subjectKind=${kind}` : ''
  }`,
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

  return (
    <>
      <ListPageHeader title={showTitle ? t('public~RoleBindings') : undefined}>
        {!mock && (
          <ListPageCreateLink to={createPath}>{t('public~Create binding')}</ListPageCreateLink>
        )}
      </ListPageHeader>
      <ListPageBody>
        <BindingsList
          data={data}
          loaded={loaded}
          loadError={resources.RoleBinding.loadError}
          staticFilters={staticFilters}
        />
      </ListPageBody>
    </>
  );
};

const NsRoleDropdown: React.FCC<RoleDropdownProps> = (props) => {
  const openshiftFlag = useFlag(FLAGS.OPENSHIFT);
  const { t } = useTranslation();

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

  return (
    <ListDropdown
      {...props}
      desc={t('public~Namespace roles (Role)')}
      resources={resources}
      placeholder={t('public~Select role name')}
    />
  );
};

const ClusterRoleDropdown: React.FCC<RoleDropdownProps> = (props) => {
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

const BaseEditRoleBinding: React.FCC<BaseEditRoleBindingProps> = (props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { fixed, saveButtonText } = props;

  const [data, setData] = React.useState({} as any);
  const [inProgress, setInProgress] = React.useState(false);
  const [error, setError] = React.useState('');

  const subjectIndex = props.subjectIndex || 0;

  const existingData = {
    ..._.pick(props.obj, ['metadata.name', 'metadata.namespace', 'roleRef', 'subjects']),
    kind: props.kind,
  };

  const { subjectKind, subjectName } = fixed.subjectRef || {};

  // constructor/didmount
  React.useEffect(() => {
    const obj = _.defaultsDeep({}, _.omit(fixed, 'subjectRef'), existingData, {
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
    const obj = Object.assign({}, data) as any;
    if (!obj.subjects) {
      obj.subjects = [];
    }
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
    const patch: any = { kind };
    if (kind === 'ClusterRoleBinding') {
      patch.metadata = { namespace: null };
    }
    updateData(patch);
  };

  const subject = getSubject();

  const save = (e) => {
    e.preventDefault();

    const { kind, metadata, roleRef } = data as any;

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
        navigate(resourceObjPath(obj, referenceFor(obj)));
      },
      (err) => {
        setError(err.message);
        setInProgress(false);
      },
    );
  };

  const RoleDropdown: React.FCC<RoleDropdownProps> =
    data.kind === 'RoleBinding' ? NsRoleDropdown : ClusterRoleDropdown;

  const title = `${props.titleVerbAndKind}`;

  const isSubjectDisabled = fixed?.subjectRef?.subjectName ? true : false;

  const bindingKinds = [
    {
      name: 'binding-type',
      value: 'RoleBinding',
      label: t('public~Namespace role binding (RoleBinding)'),
      description: t(
        'public~Grant the permissions to a user or set of users within the selected namespace.',
      ),
    },
    {
      name: 'binding-type',
      value: 'ClusterRoleBinding',
      label: t('public~Cluster-wide role binding (ClusterRoleBinding)'),
      description: t(
        'public~Grant the permissions to a user or set of users at the cluster level and in all namespaces.',
      ),
    },
  ];

  const subjectKinds = [
    { name: 'subject-kind', value: 'User', label: t('public~User') },
    { name: 'subject-kind', value: 'Group', label: t('public~Group') },
    {
      name: 'subject-kind',
      value: 'ServiceAccount',
      label: t('public~ServiceAccount'),
    },
  ];

  return (
    <>
      <DocumentTitle>{title}</DocumentTitle>
      <PageHeading
        title={<div data-test="title">{title}</div>}
        helpText={t(
          'public~Associate a user/group to the selected role to define the type of access and resources that are allowed.',
        )}
      />
      <PaneBody>
        <Form onSubmit={save} isWidthLimited>
          {!_.get(fixed, 'kind') && (
            <FormSection title={t('public~Binding type')} titleElement="h2">
              <FormGroup role="radiogroup" fieldId="binding-type-radio-group" isStack>
                {bindingKinds.map(({ label, value, name, description }) => {
                  const checked = value === data?.kind;
                  return (
                    <Radio
                      key={value}
                      id={value}
                      name={name}
                      value={value}
                      label={label}
                      description={description}
                      onChange={setKind}
                      isChecked={checked}
                      data-checked-state={checked}
                      data-test={`${label}-radio-input`}
                    />
                  );
                })}
              </FormGroup>
            </FormSection>
          )}

          <FormSection title={t('public~RoleBinding')} titleElement="h2">
            <FormGroup label={t('public~Name')} isRequired>
              {_.get(fixed, 'metadata.name') ? (
                <ResourceName kind={data?.kind} name={data?.metadata?.name} />
              ) : (
                <TextInput
                  isRequired
                  type="text"
                  id="role-binding-name"
                  name="role-binding-name"
                  value={data?.metadata?.name ?? ''}
                  onChange={changeName}
                  placeholder={t('public~RoleBinding name')}
                  data-test="role-binding-name"
                />
              )}
            </FormGroup>
            {data?.kind === 'RoleBinding' && (
              <FormGroup label={t('public~Namespace')} isRequired data-test="namespace-dropdown">
                <NsDropdown
                  fixed={!!_.get(fixed, 'metadata.namespace')}
                  selectedKey={data?.metadata?.namespace}
                  onChange={changeNamespace}
                  id="ns-dropdown"
                />
              </FormGroup>
            )}
          </FormSection>

          <FormSection title={t('public~Role')} titleElement="h2">
            <FormGroup label={t('public~Role name')} isRequired data-test="role-dropdown">
              <RoleDropdown
                fixed={!!_.get(fixed, 'roleRef.name')}
                namespace={data?.metadata?.namespace}
                onChange={changeRoleRef}
                selectedKey={_.get(fixed, 'roleRef.name') || data?.roleRef?.name}
                selectedKeyKind={_.get(fixed, 'roleRef.kind') || data?.roleRef?.kind}
                id="role-dropdown"
              />
            </FormGroup>
          </FormSection>

          <FormSection title={t('public~Subject')} titleElement="h2">
            <FormGroup role="radiogroup" fieldId="subject-radio-group" isStack>
              {subjectKinds.map(({ label, value, name }) => {
                const checked = value === subject?.kind;
                return (
                  <Radio
                    key={value}
                    id={value}
                    name={name}
                    value={value}
                    label={label}
                    onChange={changeSubjectKind}
                    isChecked={checked}
                    isDisabled={isSubjectDisabled}
                    data-checked-state={checked}
                    data-test={`${label}-radio-input`}
                  />
                );
              })}
            </FormGroup>
            {subject?.kind === 'ServiceAccount' && (
              <FormGroup label={t('public~Subject namespace')} isRequired>
                <NsDropdown
                  id="subject-namespace"
                  selectedKey={subject?.namespace}
                  onChange={changeSubjectNamespace}
                />
              </FormGroup>
            )}
            <FormGroup label={t('public~Subject name')} isRequired>
              <TextInput
                isRequired
                type="text"
                id="subject-name"
                name="subject-name"
                value={subject?.name ?? ''}
                onChange={changeSubjectName}
                placeholder={t('public~Subject name')}
                isDisabled={isSubjectDisabled}
                data-test="subject-name"
              />
            </FormGroup>
          </FormSection>

          <ButtonBar errorMessage={error} inProgress={inProgress}>
            <ActionGroup className="pf-v6-c-form">
              <Button type="submit" id="save-changes" variant="primary" data-test="save-changes">
                {saveButtonText || t('public~Create')}
              </Button>
              <Button onClick={() => navigate(-1)} id="cancel" variant="secondary">
                {t('public~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </Form>
      </PaneBody>
    </>
  );
};

export const CreateRoleBinding: React.FCC = () => {
  const params = useParams();
  const location = useLocation();
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
      setActiveNamespace={setActiveNamespace}
      metadata={metadata}
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

const BindingLoadingWrapper: React.FCC<BindingLoadingWrapperProps> = (props) => {
  const [, setActiveNamespace] = useActiveNamespace();
  const fixed: { [key: string]: any } = {};
  _.each(props.fixedKeys, (k) => (fixed[k] = _.get(props.obj.data, k)));
  return (
    <StatusBox {...props.obj}>
      <BaseEditRoleBinding
        {...props}
        setActiveNamespace={setActiveNamespace}
        fixed={fixed}
        obj={props.obj.data}
      />
    </StatusBox>
  );
};

export const EditRoleBinding: React.FCC<EditRoleBindingProps> = ({ kind }) => {
  const { t } = useTranslation();
  const params = useParams();
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

export const CopyRoleBinding: React.FCC<EditRoleBindingProps> = ({ kind }) => {
  const { t } = useTranslation();
  const params = useParams();
  return (
    <Firehose
      resources={[{ kind, name: params.name, namespace: params.ns, isList: false, prop: 'obj' }]}
    >
      <BindingLoadingWrapper
        fixedKeys={['kind']}
        subjectIndex={getSubjectIndex()}
        isCreate={true}
        titleVerbAndKind={t('public~Duplicate RoleBinding')}
      />
    </Firehose>
  );
};

type BindingKind = (RoleBindingKind | ClusterRoleBindingKind) & { subject: Subject };

type BindingFilters = ResourceFilters & { 'role-kind': string[] };

type BindingProps = {
  binding: BindingKind;
};

type BindingsListTableProps = {
  data: BindingKind[];
  loaded: boolean;
  loadError: string;
  mock?: boolean;
  staticFilters?: any;
};

type RoleBindingsPageProps = {
  mock?: boolean;
  staticFilters?: any;
  name?: string;
  kind?: string;
  createPath?: string;
} & Omit<Partial<MultiListPageProps>, 'staticFilters'>;

type RoleDropdownProps = {
  namespace?: string;
} & ListDropdownProps;

type BaseEditRoleBindingProps = {
  setActiveNamespace: (ns: string) => void;
  metadata?: { namespace: string };
  fixed?: {
    [key: string]: any;
  };
  isCreate?: boolean;
  titleVerbAndKind?: string;
  saveButtonText?: string;
  subjectIndex?: number;
  obj?: RoleBindingKind | ClusterRoleBindingKind;
  kind?: string;
};

type BindingLoadingWrapperProps = {
  fixedKeys: string[];
  subjectIndex: number;
  titleVerbAndKind: string;
  saveButtonText?: string;
  isCreate?: boolean;
  obj?: {
    data: RoleBindingKind | ClusterRoleBindingKind;
  };
};

type EditRoleBindingProps = {
  kind: string;
};

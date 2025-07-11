import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { sortable } from '@patternfly/react-table';
import { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useParams, useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { ListPageBody, K8sModel } from '@console/dynamic-plugin-sdk';
import { getResources } from '@console/internal/actions/k8s';
import { Conditions } from '@console/internal/components/conditions';
import { ErrorPage404 } from '@console/internal/components/error';
import { ResourceEventStream } from '@console/internal/components/events';
import {
  DetailsPage,
  Table,
  TableData,
  RowFunctionArgs,
  Flatten,
  Filter,
} from '@console/internal/components/factory';
import { useListPageFilter } from '@console/internal/components/factory/ListPage/filter-hook';
import {
  ListPageCreateDropdown,
  ListPageCreateLink,
} from '@console/internal/components/factory/ListPage/ListPageCreate';
import ListPageFilter from '@console/internal/components/factory/ListPage/ListPageFilter';
import ListPageHeader from '@console/internal/components/factory/ListPage/ListPageHeader';
import {
  Kebab,
  LabelList,
  ConsoleEmptyState,
  ResourceSummary,
  SectionHeading,
  navFactory,
  ResourceLink,
  AsyncComponent,
} from '@console/internal/components/utils';
import {
  useK8sWatchResources,
  useK8sWatchResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { connectToModel } from '@console/internal/kinds';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import {
  GroupVersionKind,
  K8sKind,
  K8sResourceCondition,
  K8sResourceKind,
  OwnerReference,
  apiVersionForReference,
  kindForReference,
  referenceFor,
  referenceForModel,
  nameForModel,
  CustomResourceDefinitionKind,
  definitionFor,
  K8sResourceCommon,
} from '@console/internal/module/k8s';
import {
  Status,
  SuccessStatus,
  LazyActionMenu,
  ActionMenuVariant,
  getNamespace,
  useActiveNamespace,
} from '@console/shared';
import ErrorAlert from '@console/shared/src/components/alerts/error';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useK8sModels } from '@console/shared/src/hooks/useK8sModels';
import { useResourceDetailsPage } from '@console/shared/src/hooks/useResourceDetailsPage';
import { useResourceListPage } from '@console/shared/src/hooks/useResourceListPage';
import { RouteParams } from '@console/shared/src/types';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionKind, ProvidedAPI } from '../../types';
import { useClusterServiceVersion } from '../../utils/useClusterServiceVersion';
import { DescriptorDetailsItem, DescriptorDetailsItemList } from '../descriptors';
import { DescriptorConditions } from '../descriptors/status/conditions';
import { DescriptorType, StatusCapability, StatusDescriptor } from '../descriptors/types';
import { isMainStatusDescriptor } from '../descriptors/utils';
import { providedAPIsForCSV, referenceForProvidedAPI } from '../index';
import { Resources } from '../k8s-resource';
import { OperandLink } from './operand-link';
import { ShowOperandsInAllNamespacesRadioGroup } from './ShowOperandsInAllNamespacesRadioGroup';
import { useShowOperandsInAllNamespaces } from './useShowOperandsInAllNamespaces';

const tableColumnClasses = [
  '',
  '',
  '',
  css('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-v6-u-w-16-on-lg'),
  css('pf-m-hidden', 'pf-m-visible-on-xl'),
  css('pf-m-hidden', 'pf-m-visible-on-2xl'),
  Kebab.columnClass,
];

const getOperandStatus = (obj: K8sResourceKind): OperandStatusType => {
  const { phase, status, state, conditions } = obj?.status || {};

  if (phase && _.isString(phase)) {
    return {
      type: 'Phase',
      value: phase,
    };
  }

  if (status && _.isString(status)) {
    return {
      type: 'Status',
      value: status,
    };
  }

  if (state && _.isString(state)) {
    return {
      type: 'State',
      value: state,
    };
  }

  const conditionsIsObject =
    typeof conditions === 'object' && !Array.isArray(conditions) && conditions !== null;
  const formattedConditions = conditionsIsObject ? [conditions] : conditions;

  const trueConditions = formattedConditions?.filter(
    (c: K8sResourceCondition) => c.status === 'True',
  );
  if (trueConditions?.length) {
    const types = trueConditions.map((c: K8sResourceCondition) => c.type);
    return {
      type: types.length === 1 ? 'Condition' : 'Conditions',
      value: types.join(', '),
    };
  }

  return null;
};

const hasAllNamespaces = (csv: ClusterServiceVersionKind) => {
  const olmTargetNamespaces = csv?.metadata?.annotations?.['olm.targetNamespaces'] ?? '';
  const managedNamespaces = olmTargetNamespaces?.split(',') || [];
  return managedNamespaces.length === 1 && managedNamespaces[0] === '';
};

export const OperandStatus: React.FC<OperandStatusProps> = ({ operand }) => {
  const status: OperandStatusType = getOperandStatus(operand);
  if (!status) {
    return <>-</>;
  }

  const { type, value } = status;
  return (
    <span className="co-icon-and-text">
      {type}
      <span className="pf-v6-u-pr-sm">:</span>{' '}
      {value === 'Running' ? <SuccessStatus title={value} /> : <Status status={value} />}
    </span>
  );
};

const getOperandStatusText = (operand: K8sResourceKind): string => {
  const status = getOperandStatus(operand);
  return status ? `${status.type}: ${status.value}` : '';
};

export const OperandTableRow: React.FC<OperandTableRowProps> = ({ obj, showNamespace }) => {
  const objReference = referenceFor(obj);
  const context = { [objReference]: obj, 'csv-actions': { resource: obj } };
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <OperandLink obj={obj} />
      </TableData>
      <TableData
        className={css(tableColumnClasses[1], 'co-break-word')}
        data-test-operand-kind={obj.kind}
      >
        {obj.kind}
      </TableData>
      {showNamespace && (
        <TableData className={tableColumnClasses[2]}>
          {obj.metadata.namespace ? (
            <ResourceLink
              kind="Namespace"
              title={obj.metadata.namespace}
              name={obj.metadata.namespace}
            />
          ) : (
            '-'
          )}
        </TableData>
      )}
      <TableData className={tableColumnClasses[3]}>
        <OperandStatus operand={obj} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <LabelList kind={obj.kind} labels={obj.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <LazyActionMenu context={context} isDisabled={_.has(obj.metadata, 'deletionTimestamp')} />
      </TableData>
    </>
  );
};

const getOperandNamespace = (obj: ClusterServiceVersionKind): string | null => getNamespace(obj);

export const OperandList: React.FC<OperandListProps> = (props) => {
  const { t } = useTranslation();
  const { noAPIsFound, showNamespace } = props;

  const nameHeader: Header = {
    title: t('public~Name'),
    sortField: 'metadata.name',
    transforms: [sortable],
    props: { className: tableColumnClasses[0] },
  };
  const kindHeader: Header = {
    title: t('public~Kind'),
    sortField: 'kind',
    transforms: [sortable],
    props: { className: tableColumnClasses[1] },
  };
  const namespaceHeader: Header = {
    title: t('public~Namespace'),
    sortFunc: 'getOperandNamespace',
    transforms: [sortable],
    props: { className: tableColumnClasses[2] },
  };
  const statusHeader: Header = {
    title: t('public~Status'),
    sortFunc: 'operandStatus',
    transforms: [sortable],
    props: { className: tableColumnClasses[3] },
  };
  const labelsHeader: Header = {
    title: t('public~Labels'),
    sortField: 'metadata.labels',
    transforms: [sortable],
    props: { className: tableColumnClasses[4] },
  };
  const lastUpdatedHeader: Header = {
    title: t('public~Last updated'),
    sortField: 'metadata.creationTimestamp',
    transforms: [sortable],
    props: { className: tableColumnClasses[5] },
  };
  const kebabHeader: Header = {
    title: '',
    props: { className: tableColumnClasses[6] },
  };

  const AllNsHeader = (): Header[] => [
    nameHeader,
    kindHeader,
    namespaceHeader,
    statusHeader,
    labelsHeader,
    lastUpdatedHeader,
    kebabHeader,
  ];
  const CurrentNsHeader = (): Header[] => [
    nameHeader,
    kindHeader,
    statusHeader,
    labelsHeader,
    lastUpdatedHeader,
    kebabHeader,
  ];

  const data = React.useMemo(
    () =>
      props.data?.map?.((obj) => {
        if (obj.apiVersion && obj.kind) {
          return obj;
        }
        const reference = props.kinds[0];
        return {
          apiVersion: apiVersionForReference(reference),
          kind: kindForReference(reference),
          ...obj,
        };
      }) ?? [],
    [props.data, props.kinds],
  );

  return (
    <Table
      {...props}
      customSorts={{
        operandStatus: getOperandStatusText,
        getOperandNamespace,
      }}
      data={data}
      EmptyMsg={() =>
        noAPIsFound ? (
          <ConsoleEmptyState title={t('olm~No provided APIs defined')}>
            {t('olm~This application was not properly installed or configured.')}
          </ConsoleEmptyState>
        ) : (
          <ConsoleEmptyState title={t('olm~No operands found')}>
            {t(
              'olm~Operands are declarative components used to define the behavior of the application.',
            )}
          </ConsoleEmptyState>
        )
      }
      aria-label="Operands"
      Header={showNamespace ? AllNsHeader : CurrentNsHeader}
      Row={(listProps) => <OperandTableRow {...listProps} showNamespace={showNamespace} />}
      virtualize
    />
  );
};

const getK8sWatchResources = (
  models: ProvidedAPIModels,
  providedAPIs: ProvidedAPI[],
  namespace?: string,
): GetK8sWatchResources => {
  return providedAPIs.reduce((resourceAccumulator, api) => {
    const reference = referenceForProvidedAPI(api);
    const model = models?.[reference];

    if (!model) {
      return resourceAccumulator;
    }

    const { apiGroup: group, apiVersion: version, kind, namespaced } = model;
    return {
      ...resourceAccumulator,
      [api.kind]: {
        groupVersionKind: { group, version, kind },
        isList: true,
        namespaced,
        ...(namespaced && namespace ? { namespace } : {}),
      },
    };
  }, {});
};

export const ProvidedAPIsPage = (props: ProvidedAPIsPageProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [namespace] = useActiveNamespace();
  const [showOperandsInAllNamespaces] = useShowOperandsInAllNamespaces();
  const {
    obj,
    showTitle = true,
    hideLabelFilter = false,
    hideNameLabelFilters = false,
    hideColumnManagement = false,
  } = props;
  const [models, inFlight] = useK8sModels();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [apiRefreshed, setAPIRefreshed] = React.useState(false);

  // Map APIs provided by this CSV to Firehose resources. Exclude APIs that do not have a model.
  const providedAPIs = providedAPIsForCSV(obj);

  const owners = (ownerRefs: OwnerReference[], items: K8sResourceKind[]) =>
    ownerRefs.filter(({ uid }) => items.filter(({ metadata }) => metadata.uid === uid).length > 0);
  const flatten: Flatten<{
    [key: string]: K8sResourceCommon[];
  }> = React.useCallback(
    (resources) =>
      _.flatMap(resources, (resource) => _.map(resource.data, (item) => item)).filter(
        ({ kind, metadata }, i, allResources) =>
          providedAPIs.filter((item) => item.kind === kind).length > 0 ||
          owners(metadata.ownerReferences || [], allResources).length > 0,
      ),
    [providedAPIs],
  );

  const hasNamespacedAPI = providedAPIs.some((api) => {
    const reference = referenceForProvidedAPI(api);
    const model = models[reference];

    return model?.namespaced;
  });

  const managesAllNamespaces = hasNamespacedAPI && hasAllNamespaces(obj);
  const listAllNamespaces = managesAllNamespaces && showOperandsInAllNamespaces;
  const watchedResources = getK8sWatchResources(
    models,
    providedAPIs,
    listAllNamespaces ? null : namespace,
  );

  const resources = useK8sWatchResources<{ [key: string]: K8sResourceKind[] }>(watchedResources);

  // Refresh API definitions if at least one API is missing a model and definitions have not already been refreshed.
  const apiMightBeOutdated =
    !inFlight && Object.keys(watchedResources).length < providedAPIs.length;
  React.useEffect(() => {
    if (!apiRefreshed && apiMightBeOutdated) {
      dispatch(getResources());
      setAPIRefreshed(true);
    }
  }, [apiMightBeOutdated, apiRefreshed, dispatch]);

  const createItems =
    providedAPIs.length > 1
      ? providedAPIs.reduce(
          (acc, api) => ({ ...acc, [referenceForProvidedAPI(api)]: api.displayName || api.kind }),
          {},
        )
      : {};

  const createNavigate = (kind) => navigate(`${location.pathname.replace('instances', kind)}/~new`);

  const data = React.useMemo(() => flatten(resources), [resources, flatten]);

  const rowFilters =
    Object.keys(watchedResources).length > 1
      ? [
          {
            filterGroupName: t('olm~Resource Kind'),
            type: 'clusterserviceversion-resource-kind',
            reducer: ({ kind }) => kind,
            items: Object.keys(watchedResources).map((kind) => ({
              id: kindForReference(kind),
              title: kindForReference(kind),
            })),
            filter: (filters, resource) => {
              if (!filters || !filters.selected || !filters.selected.length) {
                return true;
              }
              return filters.selected.includes(resource.kind);
            },
          },
        ]
      : [];

  const [staticData, filteredData, onFilterChange] = useListPageFilter(data, rowFilters);
  const loaded = Object.values(resources).every((r) => r.loaded);
  // only pass the first loadError as StatusBox can only display one
  const loadError: Record<string, any> = Object.values(resources).find((r) => r.loadError)
    ?.loadError;

  return inFlight ? null : (
    <>
      <ListPageHeader
        title={showTitle ? t('olm~All Instances') : undefined}
        hideFavoriteButton
        helpText={managesAllNamespaces && <ShowOperandsInAllNamespacesRadioGroup />}
      >
        <ListPageCreateDropdown onClick={createNavigate} items={createItems}>
          {t('olm~Create new')}
        </ListPageCreateDropdown>
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
        <OperandList
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
          noAPIsFound={Object.keys(watchedResources).length === 0}
          showNamespace={listAllNamespaces}
        />
      </ListPageBody>
    </>
  );
};

const DefaultProvidedAPIPage: React.FC<DefaultProvidedAPIPageProps> = (props) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [showOperandsInAllNamespaces] = useShowOperandsInAllNamespaces();

  const {
    namespace,
    csv,
    showTitle = true,
    hideLabelFilter = false,
    hideNameLabelFilters = false,
    hideColumnManagement = false,
  } = props;
  const createPath = `${location.pathname}/~new`;

  const {
    apiGroup: group,
    apiVersion: version,
    kind,
    namespaced,
    label,
    labelPlural,
  } = props.k8sModel;
  const managesAllNamespaces = namespaced && hasAllNamespaces(csv);
  const listAllNamespaces = managesAllNamespaces && showOperandsInAllNamespaces;
  const [resources, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>({
    groupVersionKind: { group, version, kind },
    isList: true,
    namespaced,
    ...(!listAllNamespaces && namespaced && namespace ? { namespace } : {}),
  });

  const [staticData, filteredData, onFilterChange] = useListPageFilter(resources);

  return (
    <>
      <ListPageHeader
        title={showTitle ? `${labelPlural}` : undefined}
        hideFavoriteButton
        helpText={managesAllNamespaces && <ShowOperandsInAllNamespacesRadioGroup />}
      >
        <ListPageCreateLink to={createPath}>
          {t('public~Create {{label}}', { label })}
        </ListPageCreateLink>
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter
          data={staticData}
          loaded={loaded}
          onFilterChange={onFilterChange}
          hideNameLabelFilters={hideNameLabelFilters}
          hideLabelFilter={hideLabelFilter}
          hideColumnManagement={hideColumnManagement}
        />
        <OperandList
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
          showNamespace={listAllNamespaces}
        />
      </ListPageBody>
    </>
  );
};

export const ProvidedAPIPage = (props: ProvidedAPIPageProps) => {
  const resourceListPage = useResourceListPage(props.kind);
  const [namespace] = useActiveNamespace();
  const [k8sModel, inFlight] = useK8sModel(props.kind);
  const [apiRefreshed, setAPIRefreshed] = React.useState(false);
  const dispatch = useDispatch();

  // Refresh API definitions if model is missing and the definitions have not already been refreshed.
  const apiMightBeOutdated = !inFlight && !k8sModel;
  React.useEffect(() => {
    if (!apiRefreshed && apiMightBeOutdated) {
      dispatch(getResources());
      setAPIRefreshed(true);
    }
  }, [dispatch, apiRefreshed, apiMightBeOutdated]);

  if (inFlight && !k8sModel) {
    return null;
  }

  if (!k8sModel) {
    return <ErrorPage404 />;
  }

  const { apiGroup: group, apiVersion: version, kind } = k8sModel;

  return resourceListPage ? (
    <AsyncComponent
      {...props}
      name={null}
      model={{ group, version, kind }}
      kind={props.kind}
      namespace={namespace}
      loader={resourceListPage}
    />
  ) : (
    <DefaultProvidedAPIPage {...props} namespace={namespace} k8sModel={k8sModel} />
  );
};

const PodStatuses: React.FC<PodStatusesProps> = ({ kindObj, obj, podStatusDescriptors, schema }) =>
  podStatusDescriptors?.length > 0 ? (
    <Grid hasGutter>
      {podStatusDescriptors.map((statusDescriptor: StatusDescriptor) => {
        return (
          <GridItem sm={6} key={statusDescriptor.path}>
            <DescriptorDetailsItem
              type={DescriptorType.status}
              descriptor={statusDescriptor}
              model={kindObj}
              obj={obj}
              schema={schema}
            />
          </GridItem>
        );
      })}
    </Grid>
  ) : null;

export const OperandDetails = connectToModel(({ crd, csv, kindObj, obj }: OperandDetailsProps) => {
  const { t } = useTranslation();
  const { kind, status } = obj;
  const [errorMessage, setErrorMessage] = React.useState(null);
  const handleError = (err: Error) => setErrorMessage(err.message);

  // Find the matching CRD spec for the kind of this resource in the CSV.
  const { displayName, specDescriptors, statusDescriptors, version } =
    [
      ...(csv?.spec?.customresourcedefinitions?.owned ?? []),
      ...(csv?.spec?.customresourcedefinitions?.required ?? []),
    ].find((def) => {
      return def.name === crd?.metadata?.name && def.version === kindObj?.apiVersion;
    }) ?? {};

  const schema =
    crd?.spec?.versions?.find((v) => v.name === version)?.schema?.openAPIV3Schema ??
    (definitionFor(kindObj) as JSONSchema7);

  const {
    podStatuses,
    mainStatusDescriptor,
    conditionsStatusDescriptors,
    otherStatusDescriptors,
  } = (statusDescriptors ?? []).reduce((acc, descriptor) => {
    if (isMainStatusDescriptor(descriptor)) {
      return {
        ...acc,
        mainStatusDescriptor: descriptor,
      };
    }

    if (
      descriptor['x-descriptors']?.includes(StatusCapability.conditions) ||
      descriptor.path === 'conditions'
    ) {
      return {
        ...acc,
        conditionsStatusDescriptors: [...(acc.conditionsStatusDescriptors ?? []), descriptor],
      };
    }

    if (descriptor['x-descriptors']?.includes(StatusCapability.podStatuses)) {
      return {
        ...acc,
        podStatuses: [...(acc.podStatuses ?? []), descriptor],
      };
    }

    return {
      ...acc,
      otherStatusDescriptors: [...(acc.otherStatusDescriptors ?? []), descriptor],
    };
  }, {} as any);

  return (
    <div className="co-operand-details co-m-pane">
      <PaneBody>
        {errorMessage && <ErrorAlert message={errorMessage} />}
        <SectionHeading text={t('olm~{{kind}} overview', { kind: displayName || kind })} />
        <PodStatuses
          kindObj={kindObj}
          obj={obj}
          schema={schema}
          podStatusDescriptors={podStatuses}
        />
        <div className="co-operand-details__section co-operand-details__section--info">
          <Grid hasGutter>
            <GridItem sm={6}>
              <ResourceSummary resource={obj} />
            </GridItem>
            {mainStatusDescriptor && (
              <GridItem sm={6}>
                <DescriptorDetailsItem
                  key={mainStatusDescriptor.path}
                  descriptor={mainStatusDescriptor}
                  model={kindObj}
                  obj={obj}
                  schema={schema}
                  type={DescriptorType.status}
                />
              </GridItem>
            )}
            {otherStatusDescriptors?.length > 0 && (
              <GridItem sm={6}>
                <DescriptorDetailsItemList
                  descriptors={otherStatusDescriptors}
                  model={kindObj}
                  obj={obj}
                  schema={schema}
                  type={DescriptorType.status}
                />
              </GridItem>
            )}
          </Grid>
        </div>
      </PaneBody>
      {!_.isEmpty(specDescriptors) && (
        <PaneBody>
          <div className="co-operand-details__section co-operand-details__section--info">
            <Grid hasGutter>
              <GridItem sm={6}>
                <DescriptorDetailsItemList
                  descriptors={specDescriptors}
                  model={kindObj}
                  obj={obj}
                  onError={handleError}
                  schema={schema}
                  type={DescriptorType.spec}
                />
              </GridItem>
            </Grid>
          </div>
        </PaneBody>
      )}
      {Array.isArray(status?.conditions) &&
        (conditionsStatusDescriptors ?? []).every(({ path }) => path !== 'conditions') && (
          <PaneBody data-test="status.conditions">
            <SectionHeading data-test="operand-conditions-heading" text={t('public~Conditions')} />
            <Conditions conditions={status.conditions} />
          </PaneBody>
        )}
      {conditionsStatusDescriptors?.length > 0 &&
        conditionsStatusDescriptors.map((descriptor) => (
          <DescriptorConditions
            key={descriptor.path}
            descriptor={descriptor}
            schema={schema}
            obj={obj}
          />
        ))}
    </div>
  );
});

type OperandDetailsPageRouteParams = RouteParams<'appName' | 'ns' | 'name' | 'plural'>;

const DefaultOperandDetailsPage = ({ k8sModel }: DefaultOperandDetailsPageProps) => {
  const { t } = useTranslation();
  const params = useParams();
  const { appName, ns, name, plural } = params;
  const location = useLocation();
  const [csv] = useClusterServiceVersion(appName, ns);
  const actionItems = React.useCallback((resourceModel: K8sKind, resource: K8sResourceKind) => {
    const context = {
      [referenceForModel(resourceModel)]: resource,
      'csv-actions': { resource },
    };
    return <LazyActionMenu context={context} variant={ActionMenuVariant.DROPDOWN} />;
  }, []);

  return (
    <DetailsPage
      name={name}
      kind={plural}
      namespace={ns}
      customData={csv}
      resources={[
        {
          kind: CustomResourceDefinitionModel.kind,
          name: nameForModel(k8sModel),
          isList: false,
          prop: 'crd',
        },
      ]}
      customActionMenu={actionItems}
      createRedirect
      breadcrumbsFor={() => [
        {
          name: t('olm~Installed Operators'),
          path: `/k8s/ns/${params.ns}/${ClusterServiceVersionModel.plural}`,
        },
        {
          name: params.appName,
          path: location.pathname.slice(0, location.pathname.lastIndexOf('/')),
        },
        {
          name: t('olm~{{item}} details', { item: kindForReference(params.plural) }), // Use url param in case model doesn't exist
          path: `${location.pathname}`,
        },
      ]}
      pages={[
        navFactory.details((props) => <OperandDetails {...props} csv={csv} />),
        navFactory.editYaml(),
        {
          // t('olm~Resources')
          nameKey: 'olm~Resources',
          href: 'resources',
          component: Resources,
        },
        navFactory.events(ResourceEventStream),
      ]}
    />
  );
};

export const OperandDetailsPage = (props) => {
  const { plural, ns, name } = useParams<OperandDetailsPageRouteParams>();
  const resourceDetailsPage = useResourceDetailsPage(plural);
  const [k8sModel, inFlight] = useK8sModel(plural);
  if (inFlight && !k8sModel) {
    return null;
  }

  if (!k8sModel) {
    return <ErrorPage404 />;
  }

  const { apiVersion: version, apiGroup: group, kind } = k8sModel;
  return resourceDetailsPage ? (
    <AsyncComponent
      {...props}
      model={{ group, version, kind }}
      namespace={ns}
      kind={plural} // TODO remove when static plugins are no longer supported
      name={name} // TODO remove when static plugins are no longer supported
      loader={resourceDetailsPage}
    />
  ) : (
    <DefaultOperandDetailsPage {...props} k8sModel={k8sModel} />
  );
};

type OperandStatusType = {
  type: string;
  value: string;
};

export type OperandListProps = {
  loaded: boolean;
  kinds?: GroupVersionKind[];
  data: K8sResourceKind[];
  filters?: Filter[];
  reduxID?: string;
  reduxIDs?: string[];
  rowSplitter?: any;
  staticFilters?: any;
  loadError?: Record<string, any>;
  noAPIsFound?: boolean;
  showNamespace?: boolean;
};

export type OperandStatusProps = {
  operand: K8sResourceKind;
};

export type OperandHeaderProps = {
  data: K8sResourceKind[];
};

export type OperandRowProps = {
  obj: K8sResourceKind;
};

export type ProvidedAPIsPageProps = {
  obj: ClusterServiceVersionKind;
  inFlight?: boolean;
  showTitle?: boolean;
  hideLabelFilter?: boolean;
  hideNameLabelFilters?: boolean;
  hideColumnManagement?: boolean;
};

export type ProvidedAPIPageProps = {
  csv: ClusterServiceVersionKind;
  kind: GroupVersionKind;
  showTitle?: boolean;
  hideLabelFilter?: boolean;
  hideNameLabelFilters?: boolean;
  hideColumnManagement?: boolean;
};

type DefaultProvidedAPIPageProps = ProvidedAPIPageProps & { k8sModel: K8sModel; namespace: string };

type PodStatusesProps = {
  kindObj: K8sKind;
  obj: K8sResourceKind;
  podStatusDescriptors: StatusDescriptor[];
  schema?: JSONSchema7;
};

export type OperandDetailsProps = {
  obj: K8sResourceKind;
  appName: string;
  kindObj: K8sKind;
  csv: ClusterServiceVersionKind;
  crd: CustomResourceDefinitionKind;
};

type DefaultOperandDetailsPageProps = { customData: any; k8sModel: K8sModel };

export type OperandResourceDetailsProps = {
  csv?: { data: ClusterServiceVersionKind };
  gvk: GroupVersionKind;
  name: string;
  namespace: string;
};

type Header = {
  title: string;
  sortField?: string;
  sortFunc?: string;
  transforms?: any;
  props: { className: string };
};

export type OperandTableRowProps = RowFunctionArgs<K8sResourceKind> & {
  showNamespace?: boolean;
};

type ProvidedAPIModels = { [key: string]: K8sKind };

type GetK8sWatchResources = {
  [key: string]: {
    kind: string;
    isList: boolean;
    namespace?: string;
    namespaced?: boolean;
  };
};
// TODO(alecmerdler): Find Webpack loader/plugin to add `displayName` to React components automagically
OperandList.displayName = 'OperandList';
OperandDetails.displayName = 'OperandDetails';
ProvidedAPIsPage.displayName = 'ProvidedAPIsPage';
DefaultProvidedAPIPage.displayName = 'DefaultProvidedAPIPage';
ProvidedAPIPage.displayName = 'ProvidedAPIPage';
DefaultOperandDetailsPage.displayName = 'DefaultOperandDetailsPage';
OperandDetailsPage.displayName = 'OperandDetailsPage';
OperandTableRow.displayName = 'OperandTableRow';
PodStatuses.displayName = 'PodStatuses';

import type { FC } from 'react';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import type { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation, useNavigate } from 'react-router';
import {
  ConsoleDataView,
  actionsCellProps,
  getNameCellProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type { K8sModel } from '@console/dynamic-plugin-sdk';
import { ListPageBody } from '@console/dynamic-plugin-sdk';
import type { GetDataViewRows } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { getResources } from '@console/internal/actions/k8s';
import { Conditions } from '@console/internal/components/conditions';
import { ErrorPage404 } from '@console/internal/components/error';
import { ResourceEventStream } from '@console/internal/components/events';
import type { Flatten } from '@console/internal/components/factory';
import { DetailsPage } from '@console/internal/components/factory';
import {
  ListPageCreateDropdown,
  ListPageCreateLink,
} from '@console/internal/components/factory/ListPage/ListPageCreate';
import ListPageHeader from '@console/internal/components/factory/ListPage/ListPageHeader';
import type { RowFilter } from '@console/internal/components/filter-toolbar';
import {
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
import type {
  GroupVersionKind,
  K8sKind,
  K8sResourceKind,
  OwnerReference,
  CustomResourceDefinitionKind,
  K8sResourceCommon,
} from '@console/internal/module/k8s';
import {
  kindForReference,
  referenceFor,
  referenceForModel,
  nameForModel,
  definitionFor,
} from '@console/internal/module/k8s';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import { ErrorAlert } from '@console/shared/src/components/alerts/error';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useK8sModels } from '@console/shared/src/hooks/useK8sModels';
import { useResourceDetailsPage } from '@console/shared/src/hooks/useResourceDetailsPage';
import { useResourceListPage } from '@console/shared/src/hooks/useResourceListPage';
import type { RouteParams } from '@console/shared/src/types/route-params';
import { ClusterServiceVersionModel } from '../../models';
import type { ClusterServiceVersionKind, ProvidedAPI } from '../../types';
import { useClusterServiceVersion } from '../../utils/useClusterServiceVersion';
import { DescriptorDetailsItem, DescriptorDetailsItems } from '../descriptors';
import { DescriptorConditions } from '../descriptors/status/conditions';
import type { StatusDescriptor } from '../descriptors/types';
import { DescriptorType, StatusCapability } from '../descriptors/types';
import { isMainStatusDescriptor } from '../descriptors/utils';
import { providedAPIsForCSV, referenceForProvidedAPI } from '../index';
import { Resources } from '../k8s-resource';
import { useOlmDataViewFilters } from '../useOlmDataViewFilters';
import { OperandLink } from './operand-link';
import { OperandStatus } from './operand-status';
import { ShowOperandsInAllNamespacesRadioGroup } from './ShowOperandsInAllNamespacesRadioGroup';
import { useOperandColumns } from './useOperandColumns';
import { useShowOperandsInAllNamespaces } from './useShowOperandsInAllNamespaces';

const hasAllNamespaces = (csv: ClusterServiceVersionKind) => {
  const olmTargetNamespaces = csv?.metadata?.annotations?.['olm.targetNamespaces'] ?? '';
  const managedNamespaces = olmTargetNamespaces?.split(',') || [];
  return managedNamespaces.length === 1 && managedNamespaces[0] === '';
};

export const getOperandDataViewRows: GetDataViewRows<K8sResourceKind> = (data, columns) =>
  data.map(({ obj }) => {
    const objReference = referenceFor(obj);
    const context = { [objReference]: obj, 'operand-actions': { resource: obj } };
    const rowCells = {
      name: { cell: <OperandLink obj={obj} />, props: getNameCellProps(obj.metadata.name) },
      kind: { cell: obj.kind, props: { 'data-test-operand-kind': obj.kind } },
      namespace: {
        cell: obj.metadata.namespace ? (
          <ResourceLink
            kind="Namespace"
            title={obj.metadata.namespace}
            name={obj.metadata.namespace}
          />
        ) : (
          '-'
        ),
      },
      status: { cell: <OperandStatus operand={obj} /> },
      labels: { cell: <LabelList kind={obj.kind} labels={obj.metadata.labels} /> },
      lastUpdated: { cell: <Timestamp timestamp={obj.metadata.creationTimestamp} /> },
      actions: {
        cell: (
          <LazyActionMenu context={context} isDisabled={_.has(obj.metadata, 'deletionTimestamp')} />
        ),
        props: actionsCellProps,
      },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });

const OperandListEmptyMsg: FC<{ noAPIsFound?: boolean }> = ({ noAPIsFound }) => {
  const { t } = useTranslation('olm');
  return noAPIsFound ? (
    <ConsoleEmptyState title={t('No provided APIs defined')}>
      {t('This application was not properly installed or configured.')}
    </ConsoleEmptyState>
  ) : (
    <ConsoleEmptyState title={t('No operands found')}>
      {t('Operands are declarative components used to define the behavior of the application.')}
    </ConsoleEmptyState>
  );
};

const OperandList: FC<OperandListProps> = (props) => {
  const { t } = useTranslation('olm');
  const { noAPIsFound, showNamespace } = props;
  const { columns } = useOperandColumns(showNamespace);
  const dataViewFilters = useOlmDataViewFilters<K8sResourceKind>(props.rowFilters);

  // ConsoleDataView has a generic empty body state, so keep the operand-specific wording by
  // short-circuiting when nothing loaded at all. Filtering down to zero rows still uses the table.
  if (props.loaded && !props.loadError && props.data?.length === 0) {
    return <OperandListEmptyMsg noAPIsFound={noAPIsFound} />;
  }

  return (
    <ConsoleDataView<K8sResourceKind>
      {...props}
      {...dataViewFilters}
      id="console.ui~v1~OperandsList"
      label={t('Operands')}
      data={props.data || []}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getOperandDataViewRows}
      // The all-namespaces toggle on this page is independent of the console's active namespace,
      // so the Namespace column has to be kept explicitly or the single-namespace auto-hide
      // strips it right back out.
      showNamespaceOverride={showNamespace}
    />
  );
};

const getK8sWatchResources = (
  models: ProvidedAPIModels,
  providedAPIs: ProvidedAPI[],
  namespace?: string,
): GetK8sWatchResources =>
  providedAPIs.reduce((resourceAccumulator, api) => {
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

export const ProvidedAPIsPage = (props: ProvidedAPIsPageProps) => {
  const { t } = useTranslation('olm');
  const location = useLocation();
  const [namespace] = useActiveNamespace();
  const [showOperandsInAllNamespaces] = useShowOperandsInAllNamespaces();
  const { obj, showTitle = true, hideLabelFilter = false, hideNameLabelFilters = false } = props;
  const [models, inFlight] = useK8sModels();
  const navigate = useNavigate();
  const dispatch = useConsoleDispatch();
  const [apiRefreshed, setAPIRefreshed] = useState(false);

  // Map APIs provided by this CSV to watch resources. Exclude APIs that do not have a model.
  const providedAPIs = providedAPIsForCSV(obj);

  const owners = (ownerRefs: OwnerReference[], items: K8sResourceKind[]) =>
    ownerRefs.filter(({ uid }) => items.filter(({ metadata }) => metadata.uid === uid).length > 0);
  const flatten: Flatten<{
    [key: string]: K8sResourceCommon[];
  }> = useCallback(
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
  // Memoized because it keys the watch, the Resource Kind rowFilters and, through those,
  // ConsoleDataView's filter state. A fresh object every render would churn all three.
  const watchedResources = useMemo(
    () => getK8sWatchResources(models, providedAPIs, listAllNamespaces ? null : namespace),
    [models, providedAPIs, listAllNamespaces, namespace],
  );

  const resources = useK8sWatchResources<{ [key: string]: K8sResourceKind[] }>(watchedResources);

  // Refresh API definitions if at least one API is missing a model and definitions have not already been refreshed.
  const apiMightBeOutdated =
    !inFlight && Object.keys(watchedResources).length < providedAPIs.length;
  useEffect(() => {
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

  const data = useMemo(() => flatten(resources), [resources, flatten]);

  // Memoized because ConsoleDataView derives its filter state from `rowFilters`; a new array
  // every render would rebuild that state and defeat the filtered-data memo.
  const rowFilters = useMemo(
    () =>
      Object.keys(watchedResources).length > 1
        ? [
            {
              filterGroupName: t('Resource Kind'),
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
        : [],
    [t, watchedResources],
  );

  const loaded = Object.values(resources).every((r) => r.loaded);
  // only pass the first loadError as StatusBox can only display one
  const loadError: Record<string, any> = Object.values(resources).find(
    (r) => r.loadError,
  )?.loadError;

  return inFlight ? null : (
    <>
      <ListPageHeader
        title={showTitle ? t('All Instances') : undefined}
        hideFavoriteButton
        helpText={managesAllNamespaces && <ShowOperandsInAllNamespacesRadioGroup />}
      >
        <ListPageCreateDropdown onClick={createNavigate} items={createItems}>
          {t('Create new')}
        </ListPageCreateDropdown>
      </ListPageHeader>
      <ListPageBody>
        <OperandList
          data={data}
          loaded={loaded}
          loadError={loadError}
          noAPIsFound={Object.keys(watchedResources).length === 0}
          showNamespace={listAllNamespaces}
          rowFilters={rowFilters}
          hideNameLabelFilters={hideNameLabelFilters}
          hideLabelFilter={hideLabelFilter}
        />
      </ListPageBody>
    </>
  );
};

const DefaultProvidedAPIPage: FC<DefaultProvidedAPIPageProps> = (props) => {
  const { t } = useTranslation('olm');
  const location = useLocation();
  const [showOperandsInAllNamespaces] = useShowOperandsInAllNamespaces();

  const {
    namespace,
    csv,
    showTitle = true,
    hideLabelFilter = false,
    hideNameLabelFilters = false,
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

  return (
    <>
      <ListPageHeader
        title={showTitle ? `${labelPlural}` : undefined}
        hideFavoriteButton
        helpText={managesAllNamespaces && <ShowOperandsInAllNamespacesRadioGroup />}
      >
        <ListPageCreateLink to={createPath}>{t('Create {{label}}', { label })}</ListPageCreateLink>
      </ListPageHeader>
      <ListPageBody>
        <OperandList
          data={resources}
          loaded={loaded}
          loadError={loadError}
          showNamespace={listAllNamespaces}
          hideNameLabelFilters={hideNameLabelFilters}
          hideLabelFilter={hideLabelFilter}
        />
      </ListPageBody>
    </>
  );
};

export const ProvidedAPIPage = (props: ProvidedAPIPageProps) => {
  const resourceListPage = useResourceListPage(props.kind);
  const [namespace] = useActiveNamespace();
  const [k8sModel, inFlight] = useK8sModel(props.kind);
  const [apiRefreshed, setAPIRefreshed] = useState(false);
  const dispatch = useConsoleDispatch();

  // Refresh API definitions if model is missing and the definitions have not already been refreshed.
  const apiMightBeOutdated = !inFlight && !k8sModel;
  useEffect(() => {
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

const PodStatuses: FC<PodStatusesProps> = ({ kindObj, obj, podStatusDescriptors, schema }) =>
  podStatusDescriptors?.length > 0 ? (
    <Grid hasGutter>
      {podStatusDescriptors.map((statusDescriptor: StatusDescriptor) => (
        <GridItem sm={6} key={statusDescriptor.path}>
          <DescriptorDetailsItem
            type={DescriptorType.status}
            descriptor={statusDescriptor}
            model={kindObj}
            obj={obj}
            schema={schema}
          />
        </GridItem>
      ))}
    </Grid>
  ) : null;

export const OperandDetails = connectToModel(({ crd, csv, kindObj, obj }: OperandDetailsProps) => {
  const { t } = useTranslation('olm');
  const { kind, status } = obj;
  const [errorMessage, setErrorMessage] = useState(null);
  const handleError = (err: Error) => setErrorMessage(err.message);

  // Find the matching CRD spec for the kind of this resource in the CSV.
  const { displayName, specDescriptors, statusDescriptors, version } =
    [
      ...(csv?.spec?.customresourcedefinitions?.owned ?? []),
      ...(csv?.spec?.customresourcedefinitions?.required ?? []),
    ].find((def) => def.name === crd?.metadata?.name && def.version === kindObj?.apiVersion) ?? {};

  const schema =
    crd?.spec?.versions?.find((v) => v.name === version)?.schema?.openAPIV3Schema ??
    (definitionFor(kindObj) as JSONSchema7);

  const { podStatuses, mainStatusDescriptor, conditionsStatusDescriptors, otherStatusDescriptors } =
    (statusDescriptors ?? []).reduce((acc, descriptor) => {
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
        <SectionHeading text={t('{{kind}} overview', { kind: displayName || kind })} />
        <PodStatuses
          kindObj={kindObj}
          obj={obj}
          schema={schema}
          podStatusDescriptors={podStatuses}
        />
        <Grid hasGutter data-test="operand-details__section--info">
          <GridItem sm={6}>
            <ResourceSummary resource={obj} />
          </GridItem>
          {mainStatusDescriptor || otherStatusDescriptors?.length > 0 ? (
            <GridItem sm={6}>
              <DescriptionList>
                {mainStatusDescriptor && (
                  <DescriptorDetailsItem
                    key={mainStatusDescriptor.path}
                    descriptor={mainStatusDescriptor}
                    model={kindObj}
                    obj={obj}
                    schema={schema}
                    type={DescriptorType.status}
                  />
                )}
                {otherStatusDescriptors?.length > 0 && (
                  <DescriptorDetailsItems
                    descriptors={otherStatusDescriptors}
                    model={kindObj}
                    obj={obj}
                    schema={schema}
                    type={DescriptorType.status}
                  />
                )}
              </DescriptionList>
            </GridItem>
          ) : null}
        </Grid>
      </PaneBody>
      {!_.isEmpty(specDescriptors) && (
        <PaneBody>
          <DescriptionList
            columnModifier={{ default: '2Col' }}
            data-test="operand-details__section--info"
          >
            <DescriptorDetailsItems
              descriptors={specDescriptors}
              model={kindObj}
              obj={obj}
              onError={handleError}
              schema={schema}
              type={DescriptorType.spec}
            />
          </DescriptionList>
        </PaneBody>
      )}
      {Array.isArray(status?.conditions) &&
        (conditionsStatusDescriptors ?? []).every(({ path }) => path !== 'conditions') && (
          <PaneBody data-test="status.conditions">
            <SectionHeading data-test="operand-conditions-heading" text={t('Conditions')} />
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

const DefaultOperandDetailsPage: FC<DefaultOperandDetailsPageProps> = ({ k8sModel }) => {
  const { t } = useTranslation('olm');
  const params = useParams();
  const { appName, ns, name, plural } = params;
  const location = useLocation();
  const [csv] = useClusterServiceVersion(appName, ns);
  const actionItems = useCallback((resourceModel: K8sKind, resource: K8sResourceKind) => {
    const context = {
      [referenceForModel(resourceModel)]: resource,
      'operand-actions': { resource },
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
          name: t('Installed Operators'),
          path: `/k8s/ns/${params.ns}/${ClusterServiceVersionModel.plural}`,
        },
        {
          name: params.appName,
          path: location.pathname.slice(0, location.pathname.lastIndexOf('/')),
        },
        {
          name: t('{{item}} details', { item: kindForReference(params.plural) }), // Use url param in case model doesn't exist
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

type OperandListProps = {
  loaded: boolean;
  data: K8sResourceKind[];
  loadError?: Record<string, any>;
  noAPIsFound?: boolean;
  showNamespace?: boolean;
  rowFilters?: RowFilter<K8sResourceKind>[];
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
};

export type ProvidedAPIsPageProps = {
  obj: ClusterServiceVersionKind;
  inFlight?: boolean;
  showTitle?: boolean;
  hideLabelFilter?: boolean;
  hideNameLabelFilters?: boolean;
};

export type ProvidedAPIPageProps = {
  csv: ClusterServiceVersionKind;
  kind: GroupVersionKind;
  showTitle?: boolean;
  hideLabelFilter?: boolean;
  hideNameLabelFilters?: boolean;
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
PodStatuses.displayName = 'PodStatuses';

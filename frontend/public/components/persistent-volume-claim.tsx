import * as React from 'react';
import * as _ from 'lodash-es';
import i18next, { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import { DataViewFilterOption } from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { ChartDonut } from '@patternfly/react-charts/victory';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { ResourceFilters, GetDataViewRows } from '@console/app/src/components/data-view/types';
import { TableColumn } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import {
  isPVCAlert,
  isPVCCreateProp,
  isPVCStatus,
  PVCStatus,
  PVCAlert,
} from '@console/dynamic-plugin-sdk/src/extensions/pvc';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import { PersistentVolumeClaimKind, referenceFor } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import ActionServiceProvider from '@console/shared/src/components/actions/ActionServiceProvider';
import ActionMenu from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';
import { Status } from '@console/shared/src/components/status/Status';
import { FLAGS } from '@console/shared/src/constants/common';
import { calculateRadius } from '@console/shared/src/utils/pod-utils';
import { getNamespace, getName } from '@console/shared/src/selectors/common';
import { getRequestedPVCSize } from '@console/shared/src/selectors/storage';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { useFlag } from '@console/shared/src/hooks/flag';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DASH } from '@console/shared/src/constants/ui';
import { Conditions } from './conditions';
import { DetailsPage, DetailsPageProps } from './factory/details';
import { ListPage } from './factory/list-page';
import { navFactory } from './utils/horizontal-nav';
import { SectionHeading } from './utils/headings';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { Selector } from './utils/selector';
import { humanizeBinaryBytes, convertToBaseValue } from './utils/units';
import { ResourceEventStream } from './events';
import { PVCMetrics, setPVCMetrics } from '@console/internal/actions/ui';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { PrometheusEndpoint } from './graphs/helpers';
import { usePrometheusPoll } from './graphs/prometheus-poll-hook';
import { VolumeAttributesClassModel } from '../models';

const { kind } = PersistentVolumeClaimModel;

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'status' },
  { id: 'persistentVolume' },
  { id: 'totalCapacity' },
  { id: 'usedCapacity' },
  { id: 'storageClass' },
  { id: '' },
];

export const PVCStatusComponent: Snail.FCC<PVCStatusProps> = ({ pvc }) => {
  const { t } = useTranslation();
  const [pvcStatusExtensions, resolved] = useResolvedExtensions<PVCStatus>(isPVCStatus);

  if (resolved && pvcStatusExtensions.length > 0) {
    const sortedByPriority = pvcStatusExtensions.sort(
      (a, b) => b.properties.priority - a.properties.priority,
    );

    const priorityStatus = sortedByPriority.find((status) => status.properties.predicate(pvc));
    const PriorityStatusComponent = priorityStatus?.properties?.status;

    return PriorityStatusComponent ? (
      <PriorityStatusComponent pvc={pvc} />
    ) : (
      <Status
        status={pvc.metadata.deletionTimestamp ? t('public~Terminating') : pvc.status.phase}
      />
    );
  }

  return (
    <Status status={pvc.metadata.deletionTimestamp ? t('public~Terminating') : pvc.status.phase} />
  );
};

const getDataViewRowsCreator: (
  t: TFunction,
  pvcMetrics: PVCMetrics,
) => GetDataViewRows<PersistentVolumeClaimKind> = (t, pvcMetrics) => (data, columns) => {
  return data.map(({ obj }) => {
    const metrics = pvcMetrics?.usedCapacity?.[getNamespace(obj)]?.[getName(obj)];
    const [name, namespace] = [getName(obj), getNamespace(obj)];
    const totalCapacityMetric = convertToBaseValue(obj.status?.capacity?.storage);
    const totalCapcityHumanized = humanizeBinaryBytes(totalCapacityMetric);
    const usedCapacity = humanizeBinaryBytes(metrics);
    const context = { [referenceFor(obj)]: obj };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={kind} name={name} namespace={namespace} title={name} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} title={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <PVCStatusComponent pvc={obj} />,
      },
      [tableColumnInfo[3].id]: {
        cell: obj.spec?.volumeName ? (
          <ResourceLink
            kind="PersistentVolume"
            name={obj.spec.volumeName}
            title={obj.spec.volumeName}
          />
        ) : (
          <div className="pf-v6-u-text-color-subtle">{t('public~No PersistentVolume')}</div>
        ),
      },
      [tableColumnInfo[4].id]: {
        cell: totalCapacityMetric ? totalCapcityHumanized.string : DASH,
      },
      [tableColumnInfo[5].id]: {
        cell: metrics ? usedCapacity.string : DASH,
      },
      [tableColumnInfo[6].id]: {
        cell: obj.spec?.storageClassName ? (
          <ResourceLink
            kind="StorageClass"
            name={obj.spec.storageClassName}
            title={obj.spec.storageClassName}
          />
        ) : (
          DASH
        ),
      },
      [tableColumnInfo[7].id]: {
        cell: <LazyActionMenu context={context} />,
        props: actionsCellProps,
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

const usePersistentVolumeClaimColumns = (): TableColumn<PersistentVolumeClaimKind>[] => {
  const { t } = useTranslation();

  const columns: TableColumn<PersistentVolumeClaimKind>[] = React.useMemo(
    () => [
      {
        title: t('public~Name'),
        sort: 'metadata.name',
        id: tableColumnInfo[0].id,
        props: { ...cellIsStickyProps, modifier: 'nowrap' },
      },
      {
        title: t('public~Namespace'),
        sort: 'metadata.namespace',
        id: tableColumnInfo[1].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('public~Status'),
        sort: 'status.phase',
        id: tableColumnInfo[2].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('public~PersistentVolume'),
        sort: 'spec.volumeName',
        id: tableColumnInfo[3].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('public~Capacity'),
        sort: 'pvcStorage',
        id: tableColumnInfo[4].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('public~Used'),
        sort: 'pvcUsed',
        id: tableColumnInfo[5].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('public~StorageClass'),
        sort: 'spec.storageClassName',
        id: tableColumnInfo[6].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: '',
        id: tableColumnInfo[7].id,
        props: { ...cellIsStickyProps },
      },
    ],
    [t],
  );

  return columns;
};

const PVCDetails: Snail.FCC<PVCDetailsProps> = ({ obj: pvc }) => {
  const flags = useFlag(FLAGS.CAN_LIST_PV);
  const { t } = useTranslation();

  const canListPV = flags[FLAGS.CAN_LIST_PV];
  const isVACSupported = useFlag(FLAGS.VAC_PLATFORM_SUPPORT);
  const name = pvc?.metadata?.name;
  const namespace = pvc?.metadata?.namespace;
  const labelSelector = pvc?.spec?.selector;
  const storageClassName = pvc?.spec?.storageClassName;
  const volumeAttributesClassName = pvc?.spec?.volumeAttributesClassName;
  const currentVolumeAttributesClassName = pvc?.status?.currentVolumeAttributesClassName;
  const volumeName = pvc?.spec?.volumeName;
  const storage = pvc?.status?.capacity?.storage;
  const requestedStorage = getRequestedPVCSize(pvc);
  const accessModes = pvc?.status?.accessModes;
  const volumeMode = pvc?.spec?.volumeMode;
  const conditions = pvc?.status?.conditions;

  const query =
    name && namespace
      ? `kubelet_volume_stats_used_bytes{persistentvolumeclaim='${name}',namespace='${namespace}'}`
      : '';

  const [response, loadError, loading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    namespace,
    query,
  });

  const totalCapacityMetric = convertToBaseValue(storage);
  const totalRequestMetric = convertToBaseValue(requestedStorage);
  const usedMetrics = response?.data?.result?.[0]?.value?.[1];
  const availableMetrics = usedMetrics ? totalCapacityMetric - Number(usedMetrics) : null;
  const totalCapacity = humanizeBinaryBytes(totalCapacityMetric);
  const availableCapacity = humanizeBinaryBytes(availableMetrics, undefined, totalCapacity.unit);
  const usedCapacity = humanizeBinaryBytes(usedMetrics, undefined, totalCapacity.unit);
  const { podStatusInnerRadius: innerRadius, podStatusOuterRadius: radius } = calculateRadius(130);

  const availableCapacityString = `${Number(availableCapacity.value.toFixed(1))} ${
    availableCapacity.unit
  }`;

  const totalCapacityString = `${Number(totalCapacity.value.toFixed(1))} ${totalCapacity.unit}`;

  const donutData = usedMetrics
    ? [
        { x: i18next.t('public~Used'), y: usedCapacity.value },
        { x: i18next.t('public~Available'), y: availableCapacity.value },
      ]
    : [{ x: i18next.t('public~Total'), y: totalCapacity.value }];

  const [pvcAlertExtensions] = useResolvedExtensions<PVCAlert>(isPVCAlert);

  const alertComponents = pvcAlertExtensions?.map(
    ({ properties: { alert: AlertComponent }, uid }) => <AlertComponent key={uid} pvc={pvc} />,
  );

  return (
    <>
      <PaneBody>
        {alertComponents}
        <SectionHeading text={t('public~PersistentVolumeClaim details')} />
        {totalCapacityMetric && !loading && (
          <div className="co-pvc-donut">
            <ChartDonut
              ariaDesc={
                availableMetrics
                  ? t('public~Available versus used capacity')
                  : t('public~Total capacity')
              }
              ariaTitle={
                availableMetrics
                  ? t('public~Available versus used capacity')
                  : t('public~Total capacity')
              }
              height={130}
              width={130}
              innerRadius={innerRadius}
              radius={radius}
              data={donutData}
              labels={({ datum }) => `${datum.y} ${totalCapacity.unit} ${datum.x}`}
              subTitle={availableMetrics ? t('public~Available') : t('public~Total')}
              title={availableMetrics ? availableCapacityString : totalCapacityString}
              constrainToVisibleArea={true}
            />
          </div>
        )}
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={pvc}>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Label selector')}</DescriptionListTerm>
                <DescriptionListDescription data-test-id="pvc-name">
                  <Selector selector={labelSelector} kind="PersistentVolume" />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </ResourceSummary>
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Status')}</DescriptionListTerm>
                <DescriptionListDescription data-test-id="pvc-status">
                  <PVCStatusComponent pvc={pvc} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Requested capacity')}</DescriptionListTerm>
                <DescriptionListDescription data-test="pvc-requested-capacity">
                  {humanizeBinaryBytes(totalRequestMetric).string}
                </DescriptionListDescription>
              </DescriptionListGroup>
              {storage && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Capacity')}</DescriptionListTerm>
                  <DescriptionListDescription data-test-id="pvc-capacity">
                    {totalCapacity.string}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {usedMetrics && _.isEmpty(loadError) && !loading && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Used')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {humanizeBinaryBytes(usedMetrics).string}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {!_.isEmpty(accessModes) && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Access modes')}</DescriptionListTerm>
                  <DescriptionListDescription data-test-id="pvc-access-mode">
                    {accessModes.join(', ')}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Volume mode')}</DescriptionListTerm>
                <DescriptionListDescription data-test-id="pvc-volume-mode">
                  {volumeMode || 'Filesystem'}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~StorageClasses')}</DescriptionListTerm>
                <DescriptionListDescription data-test-id="pvc-storageclass">
                  {storageClassName ? (
                    <ResourceLink kind="StorageClass" name={storageClassName} />
                  ) : (
                    DASH
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
              {isVACSupported &&
                !!volumeAttributesClassName &&
                volumeAttributesClassName === currentVolumeAttributesClassName && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('public~VolumeAttributesClass')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <ResourceLink
                        kind={referenceFor(VolumeAttributesClassModel)}
                        name={volumeAttributesClassName}
                      />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              {volumeName && canListPV && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~PersistentVolumes')}</DescriptionListTerm>
                  <DescriptionListDescription data-test-id="persistent-volume">
                    <ResourceLink kind="PersistentVolume" name={volumeName} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={conditions} />
      </PaneBody>
    </>
  );
};

export const PersistentVolumeClaimList: Snail.FCC<PersistentVolumeClaimListProps> = ({
  data,
  loaded,
  ...props
}) => {
  const { t } = useTranslation();
  const columns = usePersistentVolumeClaimColumns();
  const pvcMetrics = useSelector<RootState, PVCMetrics>(({ UI }) => UI.getIn(['metrics', 'pvc']));

  const getDataViewRows = React.useMemo(() => getDataViewRowsCreator(t, pvcMetrics), [
    t,
    pvcMetrics,
  ]);

  const pvcStatusFilterOptions = React.useMemo<DataViewFilterOption[]>(
    () => [
      {
        value: 'Pending',
        label: t('public~Pending'),
      },
      {
        value: 'Bound',
        label: t('public~Bound'),
      },
      {
        value: 'Lost',
        label: t('public~Lost'),
      },
    ],
    [t],
  );

  const initialFilters = React.useMemo<PersistentVolumeClaimFilters>(
    () => ({ ...initialFiltersDefault, status: [] }),
    [],
  );

  const additionalFilterNodes = React.useMemo<React.ReactNode[]>(
    () => [
      <DataViewCheckboxFilter
        key="status"
        filterId="status"
        title={t('public~Status')}
        placeholder={t('public~Filter by status')}
        options={pvcStatusFilterOptions}
      />,
    ],
    [t, pvcStatusFilterOptions],
  );

  const matchesAdditionalFilters = React.useCallback(
    (resource: PersistentVolumeClaimKind, filters: PersistentVolumeClaimFilters) => {
      // Status filter
      if (filters.status.length > 0) {
        const status = resource.status.phase;
        if (!filters.status.includes(status)) {
          return false;
        }
      }

      return true;
    },
    [],
  );

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<PersistentVolumeClaimKind>
        {...props}
        label={t('public~PersistentVolumeClaims')}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        initialFilters={initialFilters}
        additionalFilterNodes={additionalFilterNodes}
        matchesAdditionalFilters={matchesAdditionalFilters}
        hideColumnManagement
      />
    </React.Suspense>
  );
};

export const PersistentVolumeClaimsPage: Snail.FCC<PersistentVolumeClaimsPageProps> = ({
  namespace,
  ...props
}) => {
  const { t } = useTranslation();
  const createPropExtensions = useExtensions(isPVCCreateProp);
  const dispatch = useDispatch();

  const [response, loadError, loading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    namespace,
    query: 'kubelet_volume_stats_used_bytes',
  });

  const pvcMetrics =
    _.isEmpty(loadError) && !loading
      ? response?.data?.result?.reduce((acc, item) => {
          _.set(
            acc,
            ['usedCapacity', item?.metric?.namespace, item?.metric?.persistentvolumeclaim],
            Number(item?.value?.[1]),
          );
          return acc;
        }, {})
      : {};

  dispatch(setPVCMetrics(pvcMetrics));

  const initPath = `/k8s/ns/${namespace || 'default'}/persistentvolumeclaims/`;

  const createItems = createPropExtensions.map(({ properties: { label, path } }, i) => ({
    key: i + 1,
    label,
    path,
  }));

  const createProps =
    createPropExtensions.length === 0
      ? { to: initPath.concat('~new/form') }
      : {
          items: Object.assign(
            { 0: 'With Form' },
            ...createItems.map(({ key, label }) => ({ [key]: label })),
          ),
          createLink: (wizardName) => {
            if (wizardName === '0') {
              return initPath.concat('~new/form');
            }
            const item = createItems.find(({ key }) => key.toString() === wizardName);
            return initPath.concat(item.path);
          },
        };

  return (
    <ListPage
      {...props}
      title={t('public~PersistentVolumeClaims')}
      kind={kind}
      ListComponent={PersistentVolumeClaimList}
      canCreate={true}
      omitFilterToolbar={true}
      createProps={createProps}
      customData={pvcMetrics}
    />
  );
};

export const PersistentVolumeClaimsDetailsPage: Snail.FCC<DetailsPageProps> = (props) => {
  const { t } = useTranslation();

  const customActionMenu = (kindObj, obj) => {
    const resourceKind = referenceFor(kindObj);
    const context = { [resourceKind]: obj };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
  };

  return (
    <DetailsPage
      {...props}
      getResourceStatus={(pvc) =>
        pvc.metadata.deletionTimestamp ? t('public~Terminating') : pvc.status.phase
      }
      customActionMenu={customActionMenu}
      pages={[
        navFactory.details(PVCDetails),
        navFactory.editYaml(),
        navFactory.events(ResourceEventStream),
      ]}
    />
  );
};

type PersistentVolumeClaimFilters = ResourceFilters & {
  status: string[];
};

type PersistentVolumeClaimListProps = {
  data: PersistentVolumeClaimKind[];
  loaded: boolean;
  loadError: unknown;
};

type PersistentVolumeClaimsPageProps = {
  namespace?: string;
  canCreate?: boolean;
  showTitle?: boolean;
};

type PVCStatusProps = { pvc: PersistentVolumeClaimKind };

type PVCDetailsProps = { obj: PersistentVolumeClaimKind };

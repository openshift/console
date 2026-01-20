import type { FC } from 'react';
import { createContext, useContext, useMemo, Suspense, useCallback } from 'react';
import { getMachineAWSPlacement, getMachineRole } from '@console/shared/src/selectors/machine';
import { getMachineSetInstanceType } from '@console/shared/src/selectors/machineSet';
import { DASH } from '@console/shared/src/constants/ui';
import { ListPageBody, TableColumn } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import {
  Tooltip,
  Button,
  Card,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { useTranslation } from 'react-i18next';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import PaneBodyGroup from '@console/shared/src/components/layout/PaneBodyGroup';
import { MachineModel, MachineSetModel, NodeModel } from '../models';
import {
  K8sKind,
  K8sResourceKind,
  MachineDeploymentKind,
  MachineSetKind,
  MachineKind,
  NodeKind,
  referenceForModel,
  Selector as SelectorType,
  LabelSelector,
} from '../module/k8s';
import { MachinePage } from './machine';
import {
  useConfigureCountModal,
  ConfigureCountModalProps,
} from '@console/internal/components/modals/configure-count-modal';
import { DetailsPage } from './factory/details';
import { sortResourceByValue } from './factory/Table/sort';
import ListPageHeader from './factory/ListPage/ListPageHeader';
import ListPageCreate from './factory/ListPage/ListPageCreate';
import { LoadingBox } from './utils/status-box';
import { ResourceLink, resourcePath } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { Selector } from './utils/selector';
import { navFactory } from './utils/horizontal-nav';
import { useAccessReview } from './utils/rbac';
import { convertToBaseValue, formatBytesAsGiB } from './utils/units';
import { ResourceEventStream } from './events';
import { MachinesCell } from './control-plane-machine-set';

const CapacityResolverContext = createContext<CapacityResolverContextType | null>(null);

const CPUCell: FC<{ obj: MachineSetKind }> = ({ obj }) => {
  const { t } = useTranslation();
  const context = useContext(CapacityResolverContext);
  if (!context) {
    return <span>{DASH}</span>;
  }
  const { cpu } = context.capacityResolver(obj);
  return <span>{t('public~{{count}} core', { count: cpu })}</span>;
};

const MemoryCell: FC<{ obj: MachineSetKind }> = ({ obj }) => {
  const { t } = useTranslation();
  const context = useContext(CapacityResolverContext);
  if (!context) {
    return <span>{DASH}</span>;
  }
  const { memory } = context.capacityResolver(obj);
  return <span>{t('public~{{memory}} GiB', { memory })}</span>;
};

const MachinesResource = {
  isList: true,
  kind: referenceForModel(MachineModel),
};

const NodesResource = {
  isList: true,
  kind: NodeModel.kind,
  namespaced: false,
};

const useMachineCountModal = ({ resource }: ConfigureCountModalProps) => {
  const launchModal = useConfigureCountModal({
    resourceKind: MachineSetModel,
    resource,
    titleKey: 'public~Edit Machine count',
    messageKey: 'public~{{resourceKind}} maintain the proper number of healthy machines.',
    messageVariables: { resourceKind: MachineSetModel.labelPlural },
    path: '/spec/replicas',
    buttonTextKey: 'public~Save',
  });

  return useCallback(() => {
    launchModal();
  }, [launchModal]);
};

const machineReference = referenceForModel(MachineModel);
const machineSetReference = referenceForModel(MachineSetModel);

// `spec.replicas` defaults to 1 if not specified. Make sure to differentiate between undefined and 0.
export const getDesiredReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) =>
  machineSet?.spec?.replicas ?? 1;
const getReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) =>
  machineSet?.status?.replicas || 0;
export const getReadyReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) =>
  machineSet?.status?.readyReplicas || 0;
export const getAvailableReplicas = (machineSet: MachineSetKind | MachineDeploymentKind) =>
  machineSet?.status?.availableReplicas || 0;

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'machines' },
  { id: 'instanceType' },
  { id: 'cpu' },
  { id: 'memory' },
  { id: '' },
];

export const MachineCounts: FC<MachineCountsProps> = ({ resourceKind, resource }) => {
  const editReplicas = useMachineCountModal({ resource });
  const desiredReplicas = getDesiredReplicas(resource);
  const replicas = getReplicas(resource);
  const readyReplicas = getReadyReplicas(resource);
  const availableReplicas = getAvailableReplicas(resource);

  const canUpdate = useAccessReview({
    group: resourceKind.apiGroup,
    resource: resourceKind.plural,
    verb: 'patch',
    name: resource.metadata.name,
    namespace: resource.metadata.namespace,
  });
  const { t } = useTranslation();
  const desiredReplicasText = `${desiredReplicas}  ${t('public~machine', {
    count: desiredReplicas,
  })}`;

  return (
    <PaneBodyGroup>
      <DescriptionList className="co-detail-table">
        <Card>
          <DescriptionListTerm>{t('public~Desired count')}</DescriptionListTerm>
          <DescriptionListDescription>
            {canUpdate ? (
              <Button
                icon={<PencilAltIcon />}
                iconPosition="end"
                variant="link"
                type="button"
                isInline
                onClick={() => editReplicas()}
              >
                {desiredReplicasText}
              </Button>
            ) : (
              desiredReplicasText
            )}
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('public~Current count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip content={t('public~The most recently observed number of replicas.')}>
              <span>{t('public~{{replicas}} machine', { replicas, count: replicas })}</span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('public~Ready count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip
              content={t(
                'public~The number of ready replicas for this MachineSet. A machine is considered ready when the node has been created and is ready.',
              )}
            >
              <span>
                {t('public~{{readyReplicas}} machine', {
                  readyReplicas,
                  count: readyReplicas,
                })}
              </span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
        <Card>
          <DescriptionListTerm>{t('public~Available count')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Tooltip
              content={t(
                'public~The number of available replicas (ready for at least minReadySeconds) for this MachineSet.',
              )}
            >
              <span>
                {t('public~{{availableReplicas}} machine', {
                  availableReplicas,
                  count: availableReplicas,
                })}
              </span>
            </Tooltip>
          </DescriptionListDescription>
        </Card>
      </DescriptionList>
    </PaneBodyGroup>
  );
};

export const MachineTabPage: FC<MachineTabPageProps> = ({ obj }) => (
  <MachinePage namespace={obj.metadata.namespace} showTitle={false} selector={obj.spec.selector} />
);

const MachineSetDetails: FC<MachineSetDetailsProps> = ({ obj }) => {
  const machineRole = getMachineRole(obj);
  const { availabilityZone, region } = getMachineAWSPlacement(obj);
  const instanceType = getMachineSetInstanceType(obj);
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading text={t('public~MachineSet details')} />
      <MachineCounts resourceKind={MachineSetModel} resource={obj} />
      <Grid hasGutter>
        <GridItem md={6}>
          <ResourceSummary resource={obj}>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Selector')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Selector
                  kind={machineReference}
                  selector={obj.spec?.selector}
                  namespace={obj.metadata.namespace}
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Instance type')}</DescriptionListTerm>
              <DescriptionListDescription>{instanceType || '-'}</DescriptionListDescription>
            </DescriptionListGroup>
            {machineRole && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Machine role')}</DescriptionListTerm>
                <DescriptionListDescription>{machineRole}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {region && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Region')}</DescriptionListTerm>
                <DescriptionListDescription>{region}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {availabilityZone && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Availability zone')}</DescriptionListTerm>
                <DescriptionListDescription>{availabilityZone}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
          </ResourceSummary>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

const useMachineSetColumns = (): TableColumn<MachineSetKind>[] => {
  const { t } = useTranslation();
  const context = useContext(CapacityResolverContext);

  const columns: TableColumn<MachineSetKind>[] = useMemo(() => {
    return [
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
        title: t('public~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Machines'),
        id: tableColumnInfo[2].id,
        sort: 'status.readyReplicas',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Instance type'),
        id: tableColumnInfo[3].id,
        sort: (data, direction) =>
          data.sort(sortResourceByValue(direction, getMachineSetInstanceType)),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~CPU'),
        id: tableColumnInfo[4].id,
        sort: context
          ? (data, direction) =>
              data.sort(sortResourceByValue(direction, (obj) => context.capacityResolver(obj).cpu))
          : undefined,
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Memory'),
        id: tableColumnInfo[5].id,
        sort: context
          ? (data, direction) =>
              data.sort(
                sortResourceByValue(direction, (obj) => context.capacityResolver(obj).memory),
              )
          : undefined,
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[6].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t, context]);
  return columns;
};

const getDataViewRows = (
  data: { obj: MachineSetKind }[],
  columns: TableColumn<MachineSetKind>[],
) => {
  return data.map(({ obj }: { obj: MachineSetKind }) => {
    const { name, namespace } = obj.metadata;
    const readyReplicas = getReadyReplicas(obj);
    const desiredReplicas = getDesiredReplicas(obj);
    const instanceType = getMachineSetInstanceType(obj);

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={machineSetReference} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: (
          <MachinesCell
            desiredReplicas={desiredReplicas}
            readyReplicas={readyReplicas}
            path={resourcePath(machineSetReference, name, namespace)}
          />
        ),
      },
      [tableColumnInfo[3].id]: {
        cell: instanceType || DASH,
      },
      [tableColumnInfo[4].id]: {
        cell: <CPUCell obj={obj} />,
      },
      [tableColumnInfo[5].id]: {
        cell: <MemoryCell obj={obj} />,
      },
      [tableColumnInfo[6].id]: {
        cell: <LazyActionMenu context={{ [machineSetReference]: obj }} />,
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

const MachineSetListContent: FC<MachineSetListProps> = ({ data, loaded, loadError, ...props }) => {
  const columns = useMachineSetColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<MachineSetKind>
        {...props}
        label={MachineSetModel.labelPlural}
        data={data}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </Suspense>
  );
};

export const MachineSetList: FC<MachineSetListProps> = ({ data, loaded, loadError, ...props }) => {
  const [machines] = useK8sWatchResource<MachineKind[]>(MachinesResource);
  const [nodes] = useK8sWatchResource<NodeKind[]>(NodesResource);

  const capacityResolver = useCallback(
    (obj: MachineSetKind) => {
      const machine = (machines ?? [])?.find((m) => {
        return new LabelSelector(obj.spec.selector).matches(m);
      });
      const node = (nodes ?? []).find(
        (n) => machine && machine.status?.nodeRef?.uid === n.metadata.uid,
      );
      const { cpu, memory } = node?.status?.capacity ?? {};
      return {
        cpu: convertToBaseValue(cpu) ?? 0,
        memory: formatBytesAsGiB(convertToBaseValue(memory) ?? 0),
      };
    },
    [machines, nodes],
  );

  const contextValue = useMemo(() => ({ capacityResolver }), [capacityResolver]);

  return (
    <CapacityResolverContext.Provider value={contextValue}>
      <MachineSetListContent data={data} loaded={loaded} loadError={loadError} {...props} />
    </CapacityResolverContext.Provider>
  );
};

export const MachineSetPage: FC<MachineSetPageProps> = ({
  namespace,
  selector,
  showTitle = true,
  hideLabelFilter,
  hideNameLabelFilters,
  hideColumnManagement,
}) => {
  const [machineSets, loaded, loadError] = useK8sWatchResource<MachineSetKind[]>({
    isList: true,
    kind: referenceForModel(MachineSetModel),
    selector,
    namespace,
  });
  const createAccessReview = {
    groupVersionKind: referenceForModel(MachineSetModel),
    namespace: namespace || 'default',
  };

  const { t } = useTranslation();
  return (
    <>
      <ListPageHeader title={showTitle ? t('public~MachineSets') : undefined}>
        <ListPageCreate
          createAccessReview={createAccessReview}
          groupVersionKind={referenceForModel(MachineSetModel)}
        >
          {t('public~Create MachineSet')}
        </ListPageCreate>
      </ListPageHeader>
      <ListPageBody>
        <MachineSetList
          data={machineSets}
          loaded={loaded}
          loadError={loadError}
          hideNameLabelFilters={hideNameLabelFilters}
          hideLabelFilter={hideLabelFilter}
          hideColumnManagement={hideColumnManagement}
        />
      </ListPageBody>
    </>
  );
};

export const MachineSetDetailsPage: FC = (props) => (
  <DetailsPage
    {...props}
    kind={machineSetReference}
    customActionMenu={(obj: K8sResourceKind) => (
      <LazyActionMenu context={{ [machineSetReference]: obj }} />
    )}
    pages={[
      navFactory.details(MachineSetDetails),
      navFactory.editYaml(),
      navFactory.machines(MachineTabPage),
      navFactory.events(ResourceEventStream),
    ]}
  />
);

type MachineSetListProps = {
  data: MachineSetKind[];
  loaded: boolean;
  loadError?: any;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  hideColumnManagement?: boolean;
};

export type MachineCountsProps = {
  resourceKind: K8sKind;
  resource: MachineSetKind | MachineDeploymentKind;
};

export type MachineTabPageProps = {
  obj: MachineSetKind;
};

export type MachineSetDetailsProps = {
  obj: MachineSetKind;
};

export type MachineSetPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: SelectorType;
  hideLabelFilter?: boolean;
  hideNameLabelFilters?: boolean;
  hideColumnManagement?: boolean;
};

type CapacityResolverContextType = {
  capacityResolver: (obj: MachineSetKind) => { cpu: number; memory: string };
};

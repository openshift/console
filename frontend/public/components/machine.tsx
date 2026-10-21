import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import NodeIPList from '@console/app/src/components/nodes/NodeIPList';
import { ListPageBody } from '@console/dynamic-plugin-sdk';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { Status } from '@console/shared/src/components/status/Status';
import { DASH } from '@console/shared/src/constants/ui';
import {
  getMachineAddresses,
  getMachineInstanceType,
  getMachineNodeName,
  getMachineRegion,
  getMachineRole,
  getMachineZone,
  getMachinePhase,
} from '@console/shared/src/selectors/machine';
import { ClusterAPIMachineModel, MachineModel } from '../models';
import type { MachineKind, Selector } from '../module/k8s';
import { referenceFor, referenceForModel } from '../module/k8s';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
import { DetailsPage } from './factory/details';
import ListPageCreate from './factory/ListPage/ListPageCreate';
import ListPageHeader from './factory/ListPage/ListPageHeader';
import { sortResourceByValue } from './factory/Table/sort';
import { DetailsItem } from './utils/details-item';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import { useK8sWatchResources } from './utils/k8s-watch-hook';
import { NodeLink, ResourceLink } from './utils/resource-link';
import { LoadingBox } from './utils/status-box';

export const machineReference = referenceForModel(MachineModel);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'nodeRef' },
  { id: 'phase' },
  { id: 'provider' },
  { id: 'region' },
  { id: 'avail' },
  { id: '' },
];

const getMachineProviderState = (obj: MachineKind): string =>
  obj?.status?.providerStatus?.instanceState;

const getDataViewRows = (
  data: { obj: MachineKind }[],
  columns: ConsoleDataViewColumn<MachineKind>[],
) =>
  data.map(({ obj }: { obj: MachineKind }) => {
    const { name, namespace } = obj.metadata;
    const kindRef = referenceFor(obj) || machineReference;
    const nodeName = getMachineNodeName(obj);
    const region = getMachineRegion(obj);
    const zone = getMachineZone(obj);
    const providerState = getMachineProviderState(obj);

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={kindRef} name={name} namespace={namespace} />,
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: nodeName ? <NodeLink name={nodeName} /> : DASH,
      },
      [tableColumnInfo[3].id]: {
        cell: <Status status={getMachinePhase(obj)} />,
      },
      [tableColumnInfo[4].id]: {
        cell: providerState ?? DASH,
      },
      [tableColumnInfo[5].id]: {
        cell: region || DASH,
      },
      [tableColumnInfo[6].id]: {
        cell: zone || DASH,
      },
      [tableColumnInfo[7].id]: {
        cell: <LazyActionMenu context={{ [kindRef]: obj }} />,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        cell,
      };
    });
  });

const MachineDetails: FC<MachineDetailsProps> = ({ obj }: { obj: MachineKind }) => {
  const nodeName = getMachineNodeName(obj);
  const machineRole = getMachineRole(obj);
  const instanceType = getMachineInstanceType(obj);
  const region = getMachineRegion(obj);
  const zone = getMachineZone(obj);
  const providerState = getMachineProviderState(obj);
  const { t } = useTranslation('public');
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('Machine details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={obj} />
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              <DetailsItem label={t('Phase')} obj={obj} path="status.phase">
                <Status status={getMachinePhase(obj)} />
              </DetailsItem>
              <DetailsItem
                label={t('Provider state')}
                obj={obj}
                path="status.providerStatus.instanceState"
              >
                {providerState}
              </DetailsItem>
              {nodeName && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Node')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <NodeLink name={nodeName} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {machineRole && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Machine role')}</DescriptionListTerm>
                  <DescriptionListDescription>{machineRole}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {instanceType && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Instance type')}</DescriptionListTerm>
                  <DescriptionListDescription>{instanceType}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {region && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Region')}</DescriptionListTerm>
                  <DescriptionListDescription>{region}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {zone && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Availability zone')}</DescriptionListTerm>
                  <DescriptionListDescription>{zone}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Machine addresses')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <NodeIPList ips={getMachineAddresses(obj)} expand />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('Conditions')} />
        <Conditions conditions={obj.status?.providerStatus?.conditions} />
      </PaneBody>
    </>
  );
};

type MachineListProps = {
  data: MachineKind[];
  loaded: boolean;
  loadError?: any;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  hideColumnManagement?: boolean;
};

const useMachineColumns = (): {
  columns: ConsoleDataViewColumn<MachineKind>[];
} => {
  const { t } = useTranslation('public');

  const columns: ConsoleDataViewColumn<MachineKind>[] = useMemo(
    () => [
      {
        type: 'name' as const,
        id: tableColumnInfo[0].id,
      },
      {
        type: 'namespace' as const,
        id: tableColumnInfo[1].id,
      },
      {
        title: t('Node'),
        id: tableColumnInfo[2].id,
        sort: 'status.nodeRef.name',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Phase'),
        id: tableColumnInfo[3].id,
        sort: (data, direction) => data.sort(sortResourceByValue(direction, getMachinePhase)),
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Provider state'),
        id: tableColumnInfo[4].id,
        sort: 'status.providerStatus.instanceState',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Region'),
        id: tableColumnInfo[5].id,
        sort: (data, direction) => data.sort(sortResourceByValue(direction, getMachineRegion)),
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Availability zone'),
        id: tableColumnInfo[6].id,
        sort: (data, direction) => data.sort(sortResourceByValue(direction, getMachineZone)),
        props: {
          modifier: 'nowrap' as const,
        },
      },
      { type: 'actions' as const, id: tableColumnInfo[7].id },
    ],
    [t],
  );

  return { columns };
};

const MachineList: FC<MachineListProps> = ({ data, loaded, loadError, ...props }) => {
  const { columns } = useMachineColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<MachineKind>
        {...props}
        id={MachineModel}
        label={MachineModel.labelPlural}
        data={data}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        getDataViewRows={getDataViewRows}
      />
    </Suspense>
  );
};

export const MachinePage: FC<MachinePageProps> = ({
  selector,
  namespace,
  showTitle = true,
  hideLabelFilter,
  hideNameLabelFilters,
  hideColumnManagement,
}) => {
  const watchedResources = useMemo(
    () => ({
      mapMachines: {
        kind: referenceForModel(MachineModel),
        isList: true,
        selector,
        namespace,
      },
      capiMachines: {
        kind: referenceForModel(ClusterAPIMachineModel),
        isList: true,
        selector,
        namespace,
        optional: true,
      },
    }),
    [namespace, selector],
  );

  const { mapMachines, capiMachines } = useK8sWatchResources<{
    mapMachines: MachineKind[];
    capiMachines: MachineKind[];
  }>(watchedResources);

  const machines = useMemo(
    () => [...(mapMachines.data || []), ...(capiMachines.data || [])],
    [mapMachines.data, capiMachines.data],
  );
  const loaded = mapMachines.loaded && (capiMachines.loaded || !!capiMachines.loadError);
  // Ignore missing Cluster API CRDs; surface Machine API errors only.
  const { loadError } = mapMachines;

  const createAccessReview = {
    groupVersionKind: referenceForModel(MachineModel),
    namespace: namespace || 'default',
  };

  const { t } = useTranslation('public');
  return (
    <>
      <ListPageHeader title={showTitle ? t(MachineModel.labelPluralKey) : undefined}>
        <ListPageCreate
          createAccessReview={createAccessReview}
          groupVersionKind={referenceForModel(MachineModel)}
        >
          {t('Create Machine')}
        </ListPageCreate>
      </ListPageHeader>
      <ListPageBody>
        <MachineList
          data={machines}
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

export const MachineDetailsPage: FC<MachineDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    kind={props.kind || machineReference}
    pages={[
      navFactory.details(MachineDetails),
      navFactory.editYaml(),
      navFactory.events(ResourceEventStream),
    ]}
    getResourceStatus={getMachinePhase}
  />
);

type MachineDetailsProps = {
  obj: MachineKind;
};

type MachineDetailsPageProps = {
  kind?: string;
  [key: string]: any;
};

export type MachinePageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: Selector;
  hideLabelFilter?: boolean;
  hideNameLabelFilters?: boolean;
  hideColumnManagement?: boolean;
};

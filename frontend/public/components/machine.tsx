import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getMachineAddresses,
  getMachineInstanceType,
  getMachineNodeName,
  getMachineRegion,
  getMachineRole,
  getMachineZone,
  getMachinePhase,
} from '@console/shared/src/selectors/machine';
import { Status } from '@console/shared/src/components/status/Status';
import { DASH } from '@console/shared/src/constants/ui';
import { ListPageBody, TableColumn } from '@console/dynamic-plugin-sdk';
import { MachineModel } from '../models';
import { MachineKind, referenceForModel, Selector } from '../module/k8s';
import { Conditions } from './conditions';
import NodeIPList from '@console/app/src/components/nodes/NodeIPList';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage } from './factory/details';
import ListPageHeader from './factory/ListPage/ListPageHeader';
import ListPageCreate from './factory/ListPage/ListPageCreate';
import { DetailsItem } from './utils/details-item';
import { NodeLink, ResourceLink } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import { LoadingBox } from './utils/status-box';
import { ResourceEventStream } from './events';
import { useK8sWatchResource } from './utils/k8s-watch-hook';
import { sortResourceByValue } from './factory/Table/sort';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';

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

const getDataViewRows = (data: { obj: MachineKind }[], columns: TableColumn<MachineKind>[]) => {
  return data.map(({ obj }: { obj: MachineKind }) => {
    const { name, namespace } = obj.metadata;
    const nodeName = getMachineNodeName(obj);
    const region = getMachineRegion(obj);
    const zone = getMachineZone(obj);
    const providerState = getMachineProviderState(obj);

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={machineReference} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
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
        cell: <LazyActionMenu context={{ [machineReference]: obj }} />,
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

const MachineDetails: Snail.FCC<MachineDetailsProps> = ({ obj }: { obj: MachineKind }) => {
  const nodeName = getMachineNodeName(obj);
  const machineRole = getMachineRole(obj);
  const instanceType = getMachineInstanceType(obj);
  const region = getMachineRegion(obj);
  const zone = getMachineZone(obj);
  const providerState = getMachineProviderState(obj);
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~Machine details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={obj} />
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              <DetailsItem label={t('public~Phase')} obj={obj} path="status.phase">
                <Status status={getMachinePhase(obj)} />
              </DetailsItem>
              <DetailsItem
                label={t('public~Provider state')}
                obj={obj}
                path="status.providerStatus.instanceState"
              >
                {providerState}
              </DetailsItem>
              {nodeName && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Node')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <NodeLink name={nodeName} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {machineRole && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Machine role')}</DescriptionListTerm>
                  <DescriptionListDescription>{machineRole}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {instanceType && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Instance type')}</DescriptionListTerm>
                  <DescriptionListDescription>{instanceType}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {region && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Region')}</DescriptionListTerm>
                  <DescriptionListDescription>{region}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {zone && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Availability zone')}</DescriptionListTerm>
                  <DescriptionListDescription>{zone}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Machine addresses')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <NodeIPList ips={getMachineAddresses(obj)} expand />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Conditions')} />
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

const useMachineColumns = (): TableColumn<MachineKind>[] => {
  const { t } = useTranslation();

  const columns: TableColumn<MachineKind>[] = useMemo(() => {
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
        title: t('public~Node'),
        id: tableColumnInfo[2].id,
        sort: 'status.nodeRef.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Phase'),
        id: tableColumnInfo[3].id,
        sort: (data, direction) => data.sort(sortResourceByValue(direction, getMachinePhase)),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Provider state'),
        id: tableColumnInfo[4].id,
        sort: 'status.providerStatus.instanceState',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Region'),
        id: tableColumnInfo[5].id,
        sort: "metadata.labels['machine.openshift.io/region']",
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Availability zone'),
        id: tableColumnInfo[6].id,
        sort: "metadata.labels['machine.openshift.io/zone']",
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[7].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

export const MachineList: FC<MachineListProps> = ({ data, loaded, loadError, ...props }) => {
  const columns = useMachineColumns();

  return (
    (<Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<MachineKind>
        {...props}
        label={MachineModel.labelPlural}
        data={data}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </Suspense>)
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
  const [machines, loaded, loadError] = useK8sWatchResource<MachineKind[]>({
    kind: referenceForModel(MachineModel),
    isList: true,
    selector,
    namespace,
  });
  const createAccessReview = {
    groupVersionKind: referenceForModel(MachineModel),
    namespace: namespace || 'default',
  };

  const { t } = useTranslation();
  return (
    <>
      <ListPageHeader title={showTitle ? t(MachineModel.labelPluralKey) : undefined}>
        <ListPageCreate
          createAccessReview={createAccessReview}
          groupVersionKind={referenceForModel(MachineModel)}
        >
          {t('public~Create Machine')}
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

export const MachineDetailsPage: Snail.FCC = (props) => (
  <DetailsPage
    {...props}
    kind={machineReference}
    pages={[
      navFactory.details(MachineDetails),
      navFactory.editYaml(),
      navFactory.events(ResourceEventStream),
    ]}
    getResourceStatus={getMachinePhase}
  />
);

export type MachineDetailsProps = {
  obj: MachineKind;
};

export type MachinePageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: Selector;
  hideLabelFilter?: boolean;
  hideNameLabelFilters?: boolean;
  hideColumnManagement?: boolean;
};

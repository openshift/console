import * as React from 'react';
import * as _ from 'lodash-es';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { TableColumn } from '@console/dynamic-plugin-sdk/src/lib-core';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';
import { Status } from '@console/shared/src/components/status/Status';
import { DASH } from '@console/shared/src/constants/ui';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import type { DetailsPageProps } from './factory/details';
import type { ListPageProps } from './factory/list-page';
import { LabelList } from './utils/label-list';
import { navFactory } from './utils/horizontal-nav';
import { SectionHeading } from './utils/headings';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { PersistentVolumeModel } from '../models';
import { PersistentVolumeKind, referenceForModel } from '@console/internal/module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';

const { kind } = PersistentVolumeModel;
const persistentVolumeReference = referenceForModel(PersistentVolumeModel);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'status' },
  { id: 'claim' },
  { id: 'capacity' },
  { id: 'labels' },
  { id: 'created' },
  { id: '' },
];

const PVStatus = ({ pv }: { pv: PersistentVolumeKind }) => (
  <Status status={pv.metadata.deletionTimestamp ? 'Terminating' : pv.status.phase} />
);

const getDataViewRowsCreator: (t: TFunction) => GetDataViewRows<PersistentVolumeKind> = (t) => (
  data,
  columns,
) => {
  return data.map(({ obj }) => {
    const name = obj.metadata?.name || '';
    const namespace = obj.metadata?.namespace || '';
    const labels = obj.metadata?.labels || {};
    const creationTimestamp = obj.metadata?.creationTimestamp || '';

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={kind} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <PVStatus pv={obj} />,
      },
      [tableColumnInfo[2].id]: {
        cell: obj.spec?.claimRef?.name ? (
          <ResourceLink
            kind="PersistentVolumeClaim"
            name={obj.spec.claimRef.name}
            namespace={obj.spec.claimRef.namespace}
            title={obj.spec.claimRef.name}
          />
        ) : (
          <div className="pf-v6-u-text-color-subtle">{t('public~No claim')}</div>
        ),
      },
      [tableColumnInfo[3].id]: {
        cell: _.get(obj, 'spec.capacity.storage', DASH),
      },
      [tableColumnInfo[4].id]: {
        cell: <LabelList kind={kind} labels={labels} />,
      },
      [tableColumnInfo[5].id]: {
        cell: <Timestamp timestamp={creationTimestamp} />,
      },
      [tableColumnInfo[6].id]: {
        cell: <LazyActionMenu context={{ [persistentVolumeReference]: obj }} />,
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

const usePersistentVolumeColumns = (): TableColumn<PersistentVolumeKind>[] => {
  const { t } = useTranslation();

  const columns: TableColumn<PersistentVolumeKind>[] = React.useMemo(
    () => [
      {
        title: t('public~Name'),
        sort: 'metadata.name',
        id: tableColumnInfo[0].id,
        props: { ...cellIsStickyProps, modifier: 'nowrap' },
      },
      {
        title: t('public~Status'),
        sort: 'status.phase',
        id: tableColumnInfo[1].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('public~Claim'),
        sort: 'spec.claimRef.name',
        id: tableColumnInfo[2].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('public~Capacity'),
        sort: 'pvStorage',
        id: tableColumnInfo[3].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('public~Labels'),
        sort: 'metadata.labels',
        id: tableColumnInfo[4].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('public~Created'),
        sort: 'metadata.creationTimestamp',
        id: tableColumnInfo[5].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: '',
        id: tableColumnInfo[6].id,
        props: { ...cellIsStickyProps },
      },
    ],
    [t],
  );

  return columns;
};

const PVDetails = ({ obj: pv }: { obj: PersistentVolumeKind }) => {
  const { t } = useTranslation();
  const storageClassName = pv.spec?.storageClassName;
  const pvcName = pv.spec?.claimRef?.name;
  const namespace = pv.spec?.claimRef?.namespace;
  const storage = pv.spec?.capacity?.storage;
  const accessModes = pv.spec?.accessModes;
  const volumeMode = pv.spec?.volumeMode;
  const reclaimPolicy = pv.spec?.persistentVolumeReclaimPolicy;
  const nfsExport = pv.spec?.csi?.volumeAttributes?.share;

  return (
    <PaneBody>
      <SectionHeading text={t('public~PersistentVolume details')} />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={pv}>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Reclaim policy')}</DescriptionListTerm>
              <DescriptionListDescription>{reclaimPolicy}</DescriptionListDescription>
            </DescriptionListGroup>
          </ResourceSummary>
        </GridItem>
        <GridItem sm={6}>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Status')}</DescriptionListTerm>
              <DescriptionListDescription>
                <PVStatus pv={pv} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            {storage && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Capacity')}</DescriptionListTerm>
                <DescriptionListDescription>{storage}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {!_.isEmpty(accessModes) && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Access modes')}</DescriptionListTerm>
                <DescriptionListDescription>{accessModes.join(', ')}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Volume mode')}</DescriptionListTerm>
              <DescriptionListDescription>
                {volumeMode || t('public~Filesystem')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~StorageClass')}</DescriptionListTerm>
              <DescriptionListDescription>
                {storageClassName ? (
                  <ResourceLink kind="StorageClass" name={storageClassName} />
                ) : (
                  t('public~None')
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            {pvcName && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~PersistentVolumeClaim')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <ResourceLink kind="PersistentVolumeClaim" name={pvcName} namespace={namespace} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {nfsExport && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~NFS-export')}</DescriptionListTerm>
                <DescriptionListDescription>{nfsExport}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
          </DescriptionList>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export const PersistentVolumeList: Snail.FCC<PersistentVolumeListProps> = ({
  data,
  loaded,
  ...props
}) => {
  const { t } = useTranslation();
  const columns = usePersistentVolumeColumns();
  const getDataViewRows = React.useMemo(() => getDataViewRowsCreator(t), [t]);

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<PersistentVolumeKind>
        {...props}
        label={PersistentVolumeModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement
      />
    </React.Suspense>
  );
};

export const PersistentVolumesPage = (props: ListPageProps) => {
  const { t } = useTranslation();

  return (
    <ListPage
      {...props}
      title={t('public~PersistentVolumes')}
      kind={kind}
      ListComponent={PersistentVolumeList}
      canCreate={true}
      omitFilterToolbar={true}
    />
  );
};

export const PersistentVolumesDetailsPage: Snail.FCC<DetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    kind={persistentVolumeReference}
    pages={[navFactory.details(PVDetails), navFactory.editYaml()]}
  />
);

type PersistentVolumeListProps = {
  data: PersistentVolumeKind[];
  loaded: boolean;
  loadError: unknown;
};

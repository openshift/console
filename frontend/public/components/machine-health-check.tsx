import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  actionsCellProps,
  getNameCellProps,
  ConsoleDataView,
  nameCellProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
} from '@console/app/src/components/data-view/types';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DASH } from '@console/shared/src/constants/ui';
import { MachineHealthCheckModel, MachineModel } from '../models';
import { referenceForModel } from '../module/k8s/k8s';
import type { K8sResourceKind, MachineHealthCheckKind } from '../module/k8s/types';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import { DetailsItem } from './utils/details-item';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink } from './utils/resource-link';
import { Selector } from './utils/selector';
import { EmptyBox, LoadingBox } from './utils/status-box';

const machineHealthCheckReference = referenceForModel(MachineHealthCheckModel);

const tableColumnInfo = [{ id: 'name' }, { id: 'namespace' }, { id: 'created' }, { id: '' }];

const getDataViewRows: GetDataViewRows<MachineHealthCheckKind> = (data, columns) =>
  data.map(({ obj }) => {
    const { name, namespace } = obj.metadata;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={machineHealthCheckReference} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <Timestamp timestamp={obj.metadata.creationTimestamp} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <LazyActionMenu context={{ [machineHealthCheckReference]: obj }} />,
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

const useMachineHealthCheckColumns = (): {
  columns: ConsoleDataViewColumn<MachineHealthCheckKind>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('public');
  const { getResizableProps, resetAllColumnWidths } =
    useColumnWidthSettings(MachineHealthCheckModel);

  const columns: ConsoleDataViewColumn<MachineHealthCheckKind>[] = useMemo(
    () => [
      {
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        resizableProps: getResizableProps(tableColumnInfo[0].id),
        props: {
          ...nameCellProps,
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        resizableProps: getResizableProps(tableColumnInfo[1].id),
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Created'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.creationTimestamp',
        resizableProps: getResizableProps(tableColumnInfo[2].id),
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: '',
        id: tableColumnInfo[3].id,
        props: {
          ...actionsCellProps,
        },
      },
    ],
    [t, getResizableProps],
  );

  return { columns, resetAllColumnWidths };
};

const MachineHealthCheckList: FC<MachineHealthCheckListProps> = ({
  data,
  loaded,
  loadError,
  ...props
}) => {
  const { columns, resetAllColumnWidths } = useMachineHealthCheckColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<MachineHealthCheckKind>
        {...props}
        label={MachineHealthCheckModel.labelPlural}
        data={data}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement
        isResizable
        resetAllColumnWidths={resetAllColumnWidths}
      />
    </Suspense>
  );
};

const UnhealthyConditionsTable: FC<{ obj: K8sResourceKind }> = ({ obj }) => {
  const { t } = useTranslation('public');
  return _.isEmpty(obj.spec.unhealthyConditions) ? (
    <EmptyBox label={t('Unhealthy conditions')} />
  ) : (
    <Table variant="compact" borders>
      <Thead>
        <Tr>
          <Th>{t('Type')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Timeout')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {obj.spec.unhealthyConditions.map(({ status, timeout, type }) => (
          <Tr key={`${type}-${status}`}>
            <Td>{type}</Td>
            <Td>{status}</Td>
            <Td>{timeout}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

const MachineHealthCheckDetails: FC<MachineHealthCheckDetailsProps> = ({ obj }) => {
  const { t } = useTranslation('public');
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('MachineHealthCheck details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={obj}>
              <DetailsItem label={t('Selector')} obj={obj} path="spec.selector">
                <Selector
                  kind={referenceForModel(MachineModel)}
                  selector={_.get(obj, 'spec.selector')}
                  namespace={obj.metadata.namespace}
                />
              </DetailsItem>
            </ResourceSummary>
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              <DetailsItem label={t('Max unhealthy')} obj={obj} path="spec.maxUnhealthy" />
              <DetailsItem
                label={t('Expected machines')}
                obj={obj}
                path="status.expectedMachines"
              />
              <DetailsItem label={t('Current healthy')} obj={obj} path="status.currentHealthy" />
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('Unhealthy conditions')} />
        <UnhealthyConditionsTable obj={obj} />
      </PaneBody>
    </>
  );
};

export const MachineHealthCheckPage: FC<MachineHealthCheckPageProps> = (props) => (
  <ListPage
    {...props}
    ListComponent={MachineHealthCheckList}
    kind={machineHealthCheckReference}
    canCreate
    omitFilterToolbar
  />
);

export const MachineHealthCheckDetailsPage: FC = (props) => (
  <DetailsPage
    {...props}
    kind={machineHealthCheckReference}
    pages={[navFactory.details(MachineHealthCheckDetails), navFactory.editYaml()]}
  />
);

type MachineHealthCheckPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type MachineHealthCheckListProps = {
  data: MachineHealthCheckKind[];
  loaded: boolean;
  loadError?: any;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  hideColumnManagement?: boolean;
};

type MachineHealthCheckDetailsProps = {
  obj: MachineHealthCheckKind;
};

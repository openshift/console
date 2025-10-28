import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { MachineHealthCheckModel, MachineModel } from '../models';
import { K8sResourceKind, MachineHealthCheckKind } from '../module/k8s/types';
import { referenceForModel } from '../module/k8s/k8s';
import { DetailsPage, ListPage } from './factory';
import { DASH } from '@console/shared/src/constants';
import {
  DetailsItem,
  EmptyBox,
  Kebab,
  LoadingBox,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Selector,
  navFactory,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { TableColumn } from '@console/dynamic-plugin-sdk';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';

const { common } = Kebab.factory;
const menuActions = [...common];
const machineHealthCheckReference = referenceForModel(MachineHealthCheckModel);

const tableColumnInfo = [{ id: 'name' }, { id: 'namespace' }, { id: 'created' }, { id: '' }];

const getDataViewRows: GetDataViewRows<MachineHealthCheckKind, typeof menuActions> = (
  data,
  columns,
) => {
  return data.map(({ obj, rowData }) => {
    const { name, namespace } = obj.metadata;
    const actions = rowData;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={machineHealthCheckReference} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
        props: {
          modifier: 'nowrap',
        },
      },
      [tableColumnInfo[2].id]: {
        cell: <Timestamp timestamp={obj.metadata.creationTimestamp} />,
        props: {
          modifier: 'nowrap',
        },
      },
      [tableColumnInfo[3].id]: {
        cell: <ResourceKebab actions={actions} kind={machineHealthCheckReference} resource={obj} />,
        props: {
          ...actionsCellProps,
        },
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

const useMachineHealthCheckColumns = (): TableColumn<MachineHealthCheckKind>[] => {
  const { t } = useTranslation();
  const columns: TableColumn<MachineHealthCheckKind>[] = React.useMemo(() => {
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
        title: t('public~Created'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[3].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

const MachineHealthCheckList: React.FC<MachineHealthCheckListProps> = ({
  data,
  loaded,
  loadError,
  ...props
}) => {
  const columns = useMachineHealthCheckColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<MachineHealthCheckKind, typeof menuActions>
        {...props}
        label={MachineHealthCheckModel.labelPlural}
        data={data}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        customRowData={menuActions}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

const UnhealthyConditionsTable: React.FC<{ obj: K8sResourceKind }> = ({ obj }) => {
  const { t } = useTranslation();
  return _.isEmpty(obj.spec.unhealthyConditions) ? (
    <EmptyBox label={t('public~Unhealthy conditions')} />
  ) : (
    <Table variant="compact" borders={true}>
      <Thead>
        <Tr>
          <Th>{t('public~Type')}</Th>
          <Th>{t('public~Status')}</Th>
          <Th>{t('public~Timeout')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {obj.spec.unhealthyConditions.map(({ status, timeout, type }, i: number) => (
          <Tr key={i}>
            <Td>{type}</Td>
            <Td>{status}</Td>
            <Td>{timeout}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

const MachineHealthCheckDetails: React.FC<MachineHealthCheckDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~MachineHealthCheck details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={obj}>
              <DetailsItem label={t('public~Selector')} obj={obj} path="spec.selector">
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
              <DetailsItem label={t('public~Max unhealthy')} obj={obj} path="spec.maxUnhealthy" />
              <DetailsItem
                label={t('public~Expected machines')}
                obj={obj}
                path="status.expectedMachines"
              />
              <DetailsItem
                label={t('public~Current healthy')}
                obj={obj}
                path="status.currentHealthy"
              />
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Unhealthy conditions')} />
        <UnhealthyConditionsTable obj={obj} />
      </PaneBody>
    </>
  );
};

export const MachineHealthCheckPage: React.FC<MachineHealthCheckPageProps> = (props) => (
  <ListPage
    {...props}
    ListComponent={MachineHealthCheckList}
    kind={machineHealthCheckReference}
    canCreate={true}
    omitFilterToolbar={true}
  />
);

export const MachineHealthCheckDetailsPage: React.FC = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
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

export type MachineHealthCheckDetailsProps = {
  obj: MachineHealthCheckKind;
};

import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type { GetDataViewRows } from '@console/app/src/components/data-view/types';
import type { TableColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { Selector } from '@console/internal/components/utils/selector';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import { referenceForModel } from '@console/internal/module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { DASH } from '@console/shared/src/constants/ui';
import { PodDisruptionBudgetModel } from '../../models';
import AvailabilityDisplay from './AvailabilityDisplay';
import DisruptionsAllowed from './DisruptionsAllowed';
import type { PodDisruptionBudgetKind } from './types';

export const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'selector' },
  { id: 'minAvailable' },
  { id: 'disruptionsAllowed' },
  { id: 'creationTimestamp' },
  { id: '' },
];

const getDataViewRows: GetDataViewRows<PodDisruptionBudgetKind> = (data, columns) => {
  return data.map(({ obj: pdb }) => {
    const { name, namespace } = pdb.metadata;
    const resourceKind = referenceForModel(PodDisruptionBudgetModel);
    const context = { [resourceKind]: pdb };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={resourceKind} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <Selector selector={pdb.spec.selector} namespace={namespace} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <AvailabilityDisplay pdb={pdb} />,
      },
      [tableColumnInfo[4].id]: {
        cell: <DisruptionsAllowed pdb={pdb} />,
      },
      [tableColumnInfo[5].id]: {
        cell: <Timestamp timestamp={pdb.metadata.creationTimestamp} />,
      },
      [tableColumnInfo[6].id]: {
        cell: <LazyActionMenu context={context} />,
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

const usePDBColumns = (): TableColumn<PodDisruptionBudgetKind>[] => {
  const { t } = useTranslation();
  const columns = useMemo(() => {
    return [
      {
        title: t('console-app~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Selector'),
        id: tableColumnInfo[2].id,
        sort: 'spec.selector',
        props: {
          modifier: 'nowrap',
          width: 20,
        },
      },
      {
        title: t('console-app~Availability'),
        id: tableColumnInfo[3].id,
        sort: 'spec.minAvailable',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Allowed disruptions'),
        id: tableColumnInfo[4].id,
        sort: 'status.disruptionsAllowed',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('console-app~Created'),
        id: tableColumnInfo[5].id,
        sort: 'metadata.creationTimestamp',
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
  }, [t]);
  return columns;
};

const PodDisruptionBudgetList: FC<PodDisruptionBudgetsListProps> = ({ data, loaded, ...props }) => {
  const columns = usePDBColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<PodDisruptionBudgetKind>
        {...props}
        label={PodDisruptionBudgetModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement
      />
    </Suspense>
  );
};

export default PodDisruptionBudgetList;

type PodDisruptionBudgetsListProps = {
  data: PodDisruptionBudgetKind[];
  loaded: boolean;
  loadError?: any;
};

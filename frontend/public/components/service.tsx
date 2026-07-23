import type { FC } from 'react';
import { Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ConsoleDataView,
  actionsCellProps,
  getLabelsColumnWidthStyleProp,
  getNameCellProps,
  nameCellProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { TableColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { DASH } from '@console/shared/src/constants/ui';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { K8sResourceKind, referenceFor, referenceForModel } from '../module/k8s';
import { ServiceModel } from '../models';
import { ListPage } from './factory/list-page';
import { LabelList } from './utils/label-list';
import { ResourceLink } from './utils/resource-link';
import { Selector } from './utils/selector';
import { LoadingBox } from './utils/status-box';

const kind = referenceForModel(ServiceModel);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'labels' },
  { id: 'selector' },
  { id: 'created' },
  { id: '' },
];

const getDataViewRows: GetDataViewRows<K8sResourceKind> = (data, columns) => {
  return data.map(({ obj }) => {
    const { name, namespace } = obj.metadata;
    const context = { [referenceFor(obj)]: obj };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(ServiceModel)}
            name={name}
            namespace={namespace}
          />
        ),
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <LabelList kind={kind} labels={obj.metadata.labels} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <Selector selector={obj.spec.selector} namespace={namespace} />,
      },
      [tableColumnInfo[4].id]: {
        cell: <Timestamp timestamp={obj.metadata.creationTimestamp} />,
      },
      [tableColumnInfo[5].id]: {
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

const useServiceColumns = (): {
  columns: TableColumn<K8sResourceKind>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('public');
  const { getResizableProps, getWidth, resetAllColumnWidths } = useColumnWidthSettings(
    ServiceModel,
  );

  const columns = useMemo(() => {
    return [
      {
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        resizableProps: getResizableProps(tableColumnInfo[0].id),
        props: {
          ...nameCellProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        resizableProps: getResizableProps(tableColumnInfo[1].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Labels'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.labels',
        resizableProps: getResizableProps(tableColumnInfo[2].id),
        props: {
          modifier: 'nowrap',
          ...getLabelsColumnWidthStyleProp(getWidth(tableColumnInfo[2].id)),
        },
      },
      {
        title: t('Pod selector'),
        id: tableColumnInfo[3].id,
        sort: 'spec.selector',
        resizableProps: getResizableProps(tableColumnInfo[3].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Created'),
        id: tableColumnInfo[4].id,
        sort: 'metadata.creationTimestamp',
        resizableProps: getResizableProps(tableColumnInfo[4].id),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[5].id,
        props: {
          ...actionsCellProps,
        },
      },
    ];
  }, [t, getResizableProps, getWidth]);

  return { columns, resetAllColumnWidths };
};

const ServicesList: FC<ServicesListProps> = ({ data, loaded, ...props }) => {
  const { columns, resetAllColumnWidths } = useServiceColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<K8sResourceKind>
        {...props}
        label={ServiceModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
        isResizable
        resetAllColumnWidths={resetAllColumnWidths}
      />
    </Suspense>
  );
};

export const ServicesPage: FC<ServicesPageProps> = (props) => {
  const { canCreate = true } = props;
  return (
    <ListPage
      {...props}
      kind={kind}
      ListComponent={ServicesList}
      canCreate={canCreate}
      omitFilterToolbar={true}
    />
  );
};

type ServicesListProps = {
  data: K8sResourceKind[];
  loaded: boolean;
};

type ServicesPageProps = {
  canCreate?: boolean;
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

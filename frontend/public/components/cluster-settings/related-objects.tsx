import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  referenceForModel,
  ClusterOperator,
  ClusterOperatorObjectReference,
  useModelFinder,
} from '../../module/k8s';
import { ResourceLink } from '../utils';
import { DASH } from '@console/shared/src/constants';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  getNameCellProps,
  cellIsStickyProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import {
  ResourceFilters,
  ConsoleDataViewColumn,
  ConsoleDataViewRow,
  ResourceMetadata,
} from '@console/app/src/components/data-view/types';
import { RowProps, TableColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

const columnIds = [{ id: 'name' }, { id: 'resource' }, { id: 'group' }, { id: 'namespace' }];

const ResourceObjectName: React.FC<ResourceObjectNameProps> = ({ gsv, name, namespace }) => {
  if (!name) {
    return <>{DASH}</>;
  }
  if (gsv) {
    return <ResourceLink kind={gsv} name={name} namespace={namespace} />;
  }
  return <>{name}</>;
};

type RelatedObjectsFilters = ResourceFilters;

type RelatedObjectsRowData = {
  findModel: any;
};

const getRelatedObjectsDataViewRows = (
  rowData: RowProps<ClusterOperatorObjectReference, RelatedObjectsRowData>[],
  tableColumns: ConsoleDataViewColumn<ClusterOperatorObjectReference>[],
): ConsoleDataViewRow[] => {
  return rowData.map(({ obj, rowData: customData }) => {
    const { name, resource, namespace, group } = obj;
    const { findModel } = customData;
    const model = findModel(group, resource);
    const gsv = model ? referenceForModel(model) : null;

    const rowCells = {
      [columnIds[0].id]: {
        cell: <ResourceObjectName gsv={gsv} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
      },
      [columnIds[1].id]: {
        cell: resource,
      },
      [columnIds[2].id]: {
        cell: group || DASH,
      },
      [columnIds[3].id]: {
        cell: namespace ? <ResourceLink kind="Namespace" name={namespace} /> : DASH,
      },
    };

    return tableColumns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

const useRelatedObjectsColumns = (): TableColumn<ClusterOperatorObjectReference>[] => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: columnIds[0].id,
        sort: 'name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Resource'),
        id: columnIds[1].id,
        sort: 'resource',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Group'),
        id: columnIds[2].id,
        sort: 'group',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
        id: columnIds[3].id,
        sort: 'namespace',
        props: {
          modifier: 'nowrap',
        },
      },
    ];
  }, [t]);
  return columns;
};

const getObjectMetadata = (object: ClusterOperatorObjectReference): ResourceMetadata => {
  return { name: object.name };
};

const RelatedObjects: React.FC<RelatedObjectsProps> = ({ data }) => {
  const { findModel } = useModelFinder();
  const { t } = useTranslation();
  const columns = useRelatedObjectsColumns();

  const customRowData: RelatedObjectsRowData = {
    findModel,
  };

  return (
    <React.Suspense fallback={<div className="loading-skeleton--table" />}>
      <ConsoleDataView<ClusterOperatorObjectReference, RelatedObjectsRowData, RelatedObjectsFilters>
        label={t('public~Related objects')}
        data={data}
        loaded={true}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getObjectMetadata={getObjectMetadata}
        getDataViewRows={getRelatedObjectsDataViewRows}
        customRowData={customRowData}
        hideColumnManagement={true}
        hideNameLabelFilters={false}
        hideLabelFilter={true}
      />
    </React.Suspense>
  );
};

const RelatedObjectsPage: React.FC<RelatedObjectsPageProps> = (props) => {
  const relatedObject: ClusterOperatorObjectReference[] = props.obj?.status?.relatedObjects;
  const data: ClusterOperatorObjectReference[] =
    relatedObject?.filter(({ resource }) => resource) || [];
  return (
    <PaneBody>
      <RelatedObjects data={data} />
    </PaneBody>
  );
};

export default RelatedObjectsPage;

type ResourceObjectNameProps = {
  gsv: string;
  name: string;
  namespace: string;
};

type RelatedObjectsPageProps = {
  obj: ClusterOperator;
};

type RelatedObjectsProps = {
  data: ClusterOperatorObjectReference[];
};

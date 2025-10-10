import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { GeneralDataView } from '@console/app/src/components/data-view/GeneralDataView';
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
} from '@console/app/src/components/data-view/ResourceDataView';
import { GeneralRowProps } from '@console/app/src/components/data-view/types';

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

const getDataViewRows = (
  data: GeneralRowProps<ClusterOperatorObjectReference, any>[],
  findModel: (group: string, resource: string) => any,
) => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) => {
    const { name, resource, namespace, group } = item.obj;
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

    return columnIds.map(({ id }) => ({
      id,
      cell: rowCells[id].cell,
      props: rowCells[id].props,
    }));
  });
};

const RelatedObjects: React.FC<RelatedObjectsProps> = ({ data }) => {
  const { findModel } = useModelFinder();
  const { t } = useTranslation();

  const columns = React.useMemo(
    () => [
      {
        id: columnIds[0].id,
        title: t('public~Name'),
        sort: 'name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        id: columnIds[1].id,
        title: t('public~Resource'),
        sort: 'resource',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        id: columnIds[2].id,
        title: t('public~Group'),
        sort: 'group',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        id: columnIds[3].id,
        title: t('public~Namespace'),
        sort: 'namespace',
        props: {
          modifier: 'nowrap',
        },
      },
    ],
    [t],
  );

  // Create a wrapper function that includes findModel
  const getDataViewRowsWithFindModel = React.useCallback(
    (dataItems: GeneralRowProps<ClusterOperatorObjectReference, any>[]) =>
      getDataViewRows(dataItems, findModel),
    [findModel],
  );

  return (
    <GeneralDataView
      label={t('public~Related objects')}
      data={data}
      loaded={true}
      columns={columns}
      initialFilters={initialFiltersDefault}
      getDataViewRows={getDataViewRowsWithFindModel}
      getNameFromItem={(item) => item.name}
      hideLabelFilter={true}
      hideColumnManagement={true}
    />
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

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { compose } from 'redux';
import { IRow, sortable } from '@patternfly/react-table';
import {
  getNamespace,
  getName,
  useSelectList,
  getUID,
  useDeepCompareMemoize,
} from '@console/shared';
import { Table, ListPage, Filter } from '@console/internal/components/factory';
import { getFilteredRows } from '@console/internal/components/factory/table-data-hook';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { NamespaceStoreKind } from '../../types';
import { NooBaaNamespaceStoreModel } from '../../models';
import { getNamespaceStoreType, getNSRegion } from '../../utils';
import './namespace-store-table.scss';

const tableColumnClasses = [
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
];

const getRows: GetRows = (rowProps, selectedItems) => {
  const {
    componentProps: { data },
  } = rowProps;

  const rows = data.map((ns) => {
    const cells: IRow['cells'] = [
      {
        title: (
          <ResourceLink
            linkTo={false}
            kind={referenceForModel(NooBaaNamespaceStoreModel)}
            name={getName(ns)}
            namespace={getNamespace(ns)}
          />
        ),
      },
      {
        title: getNSRegion(ns) || '-',
      },
      {
        title: getNamespaceStoreType(ns) || '-',
      },
    ];
    return {
      cells,
      selected: selectedItems?.has(ns.metadata.uid),
      props: {
        id: getUID(ns),
      },
    };
  });
  return rows;
};

type GetRows = (
  rowProps: { componentProps: { data: NamespaceStoreKind[] } },
  selectedItems: Set<string>,
) => { cells: IRow['cells']; selected: boolean; props: { id: string } }[];

const NamespaceStoreTable: React.FC<NamespaceStoreTableProps> = (props) => {
  const { t } = useTranslation();

  const {
    customData: { onRowsSelected, preSelected },
    data,
    filters,
  } = props;
  const visibleRows = getFilteredRows(filters, null, data);
  const visibleUIDs = React.useMemo(() => new Set<string>(visibleRows?.map(getUID)), [visibleRows]);
  const { onSelect, selectedRows, updateSelectedRows } = useSelectList<NamespaceStoreKind>(
    data,
    visibleUIDs,
    onRowsSelected,
  );
  const memoizedData = useDeepCompareMemoize(data, true);
  React.useEffect(() => {
    if (!_.isEmpty(preSelected) && selectedRows.size === 0) {
      const preSelectedRows = memoizedData.filter((item) => preSelected.includes(getUID(item)));
      updateSelectedRows(preSelectedRows);
    }
  }, [memoizedData, preSelected, selectedRows.size, updateSelectedRows]);
  const getColumns = () => [
    {
      title: t('ceph-storage-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('ceph-storage-plugin~Region'),
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('ceph-storage-plugin~Provider'),
      props: { className: tableColumnClasses[2] },
    },
  ];

  return (
    <div className="nb-ns__namespacestore-table">
      <Table
        {...props}
        onSelect={onSelect}
        virtualize={false}
        Header={getColumns}
        Rows={(rowProps) => getRows(rowProps, selectedRows)}
        aria-label={t('ceph-storage-plugin~Namespace Store Table')}
      />
    </div>
  );
};

type NamespaceStoreTableProps = {
  data?: NamespaceStoreKind[];
  customData?: {
    onRowsSelected?: (arg: NamespaceStoreKind[]) => void;
    preSelected?: string[];
  };
  filters?: Filter[];
  preSelected?: string[];
};

export const NamespaceStoreList: React.FC<NamespaceStoreListProps> = ({
  unselectableItems = [],
  onSelectNamespaceStore,
  preSelected = [],
  name,
}) => {
  const flatten = compose(
    (data: NamespaceStoreKind[]) =>
      data.filter((item) => !unselectableItems.includes(item?.metadata?.uid)),
    (resources) => resources?.[referenceForModel(NooBaaNamespaceStoreModel)]?.data ?? {},
  );

  return (
    <div className="nb-ns-table">
      <ListPage
        kind={referenceForModel(NooBaaNamespaceStoreModel)}
        showTitle={false}
        flatten={flatten}
        ListComponent={NamespaceStoreTable}
        customData={{ onRowsSelected: onSelectNamespaceStore, preSelected }}
        name={name}
      />
    </div>
  );
};

type NamespaceStoreListProps = {
  unselectableItems?: string[];
  onSelectNamespaceStore?: (arg: NamespaceStoreKind[]) => void;
  preSelected?: string[];
  name?: string;
};

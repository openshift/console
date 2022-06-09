import * as React from 'react';
import { sortable, SortByDirection } from '@patternfly/react-table';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableProps,
  TableData,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import { Kebab, ResourceLink } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { Build } from '../../types';

const columnClassNames = [
  '', // name
  '', // namespace
  'pf-m-hidden pf-m-visible-on-xl', // output
  'pf-m-hidden pf-m-visible-on-lg', // status
  Kebab.columnClass,
];

export const BuildHeader = () => {
  // This function is NOT called as component, so we can not use useTranslation here.
  const t = i18next.t.bind(i18next);

  return [
    {
      title: i18next.t('shipwright-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: columnClassNames[0] },
    },
    {
      id: 'namespace',
      title: t('shipwright-plugin~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: columnClassNames[1] },
    },
    {
      title: t('shipwright-plugin~Output'),
      sortField: 'spec.output.image',
      transforms: [sortable],
      props: { className: columnClassNames[2] },
    },
    {
      title: t('shipwright-plugin~Status'),
      sortField: 'status.message',
      transforms: [sortable],
      props: { className: columnClassNames[3] },
    },
    {
      title: '',
      props: { className: columnClassNames[4] },
    },
  ];
};

export const BuildRow: React.FC<RowFunctionArgs<Build>> = ({ obj: build }) => {
  const kindReference = referenceFor(build);
  const context = { [kindReference]: build };

  return (
    <>
      <TableData className={columnClassNames[0]}>
        <ResourceLink
          kind={kindReference}
          name={build.metadata.name}
          namespace={build.metadata.namespace}
        />
      </TableData>
      <TableData className={columnClassNames[1]} columnID="namespace">
        <ResourceLink kind="Namespace" name={build.metadata.namespace} />
      </TableData>
      <TableData className={columnClassNames[2]}>{build.spec?.output?.image}</TableData>
      <TableData className={columnClassNames[3]}>{build.status?.message}</TableData>
      <TableData className={columnClassNames[4]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

export const BuildTable: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();

  return (
    <Table
      {...props}
      aria-label={t('shipwright-plugin~Builds')}
      Header={BuildHeader}
      Row={BuildRow}
      defaultSortField="metadata.name"
      defaultSortOrder={SortByDirection.asc}
      virtualize
    />
  );
};

export default BuildTable;

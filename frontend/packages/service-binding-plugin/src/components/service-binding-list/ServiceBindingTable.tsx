import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  TableData,
  RowFunctionArgs,
  Table,
  TableProps,
} from '@console/internal/components/factory';
import { Kebab, ResourceLink, Timestamp } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { ServiceBinding } from '../../types';
import ServiceBindingStatus from '../service-binding-status/ServiceBindingStatus';

const columnClassNames = [
  '', // name
  '', // namespace
  'pf-m-hidden pf-m-visible-on-lg', // labels
  'pf-m-hidden pf-m-visible-on-xl', // created
  Kebab.columnClass,
];

export const ServiceBindingHeader = () => {
  const t = i18next.t.bind(i18next);

  return [
    {
      title: t('service-binding-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: columnClassNames[0] },
    },
    {
      id: 'namespace',
      title: t('service-binding-plugin~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: columnClassNames[1] },
    },
    {
      title: t('service-binding-plugin~Status'),
      props: { className: columnClassNames[2] },
    },
    {
      title: t('service-binding-plugin~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: columnClassNames[3] },
    },
    {
      title: '',
      props: { className: columnClassNames[4] },
    },
  ];
};

export const ServiceBindingRow: React.FC<RowFunctionArgs<ServiceBinding>> = ({
  obj: serviceBinding,
}) => {
  const kindReference = referenceFor(serviceBinding);
  const context = { [kindReference]: serviceBinding };

  return (
    <>
      <TableData className={columnClassNames[0]}>
        <ResourceLink
          kind={kindReference}
          name={serviceBinding.metadata.name}
          namespace={serviceBinding.metadata.namespace}
        />
      </TableData>
      <TableData className={columnClassNames[1]} columnID="namespace">
        <ResourceLink kind="Namespace" name={serviceBinding.metadata.namespace} />
      </TableData>
      <TableData className={columnClassNames[2]}>
        <ServiceBindingStatus serviceBinding={serviceBinding} />
      </TableData>
      <TableData className={columnClassNames[3]}>
        <Timestamp timestamp={serviceBinding.metadata.creationTimestamp} />
      </TableData>
      <TableData className={columnClassNames[4]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

const ServiceBindingTable: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();

  return (
    <Table
      {...props}
      aria-label={t('service-binding-plugin~ServiceBindings')}
      Header={ServiceBindingHeader}
      Row={ServiceBindingRow}
      virtualize
    />
  );
};

export default ServiceBindingTable;

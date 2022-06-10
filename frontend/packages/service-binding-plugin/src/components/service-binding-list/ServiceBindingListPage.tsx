import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FilterValue } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ListPage } from '@console/internal/components/factory';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { referenceForModel } from '@console/internal/module/k8s';
import { ServiceBindingModel } from '../../models';
import { ServiceBinding } from '../../types';
import { getComputedServiceBindingStatus } from '../../utils';
import ServiceBindingTable from './ServiceBindingTable';

type ListPageProps = React.ComponentProps<typeof ListPage>;

type ServiceBindingListPageProps = Omit<
  ListPageProps,
  'title' | 'badge' | 'kind' | 'ListComponent' | 'rowFilters'
>;

const ServiceBindingListPage: React.FC<ServiceBindingListPageProps> = (props) => {
  const { t } = useTranslation();

  const filters: RowFilter<ServiceBinding>[] = [
    {
      filterGroupName: t('service-binding-plugin~Status'),
      type: 'status',
      items: [
        { id: 'Connected', title: t('service-binding-plugin~Connected') },
        { id: 'Error', title: t('service-binding-plugin~Error') },
      ],
      filter: (filterValue: FilterValue, serviceBinding: ServiceBinding): boolean => {
        const status = getComputedServiceBindingStatus(serviceBinding);
        return !filterValue.selected?.length || (status && filterValue.selected.includes(status));
      },
      reducer: getComputedServiceBindingStatus,
    },
  ];

  return (
    <ListPage
      title={t('service-binding-plugin~ServiceBindings')}
      kind={referenceForModel(ServiceBindingModel)}
      ListComponent={ServiceBindingTable}
      rowFilters={filters}
      canCreate
      {...props}
    />
  );
};

export default ServiceBindingListPage;

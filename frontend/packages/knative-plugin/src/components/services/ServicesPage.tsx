import type { ComponentProps, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import type { RowFilter } from '@console/internal/components/filter-toolbar';
import { referenceForModel } from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { ServiceModel } from '../../models';
import { isServerlessFunction } from '../../topology/knative-topology-utils';
import type { ServiceKind } from '../../types';
import { ServiceTypeValue } from '../../types';
import ServiceList from './ServiceList';

const ServicesPage: FC<ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();

  const filterReducer = (service): ServiceTypeValue => {
    if (isServerlessFunction(service)) return ServiceTypeValue.Function;
    return ServiceTypeValue.Service;
  };

  const filters: RowFilter<ServiceKind>[] = [
    {
      type: 'type',
      filterGroupName: t('knative-plugin~Type'),
      items: [
        { id: ServiceTypeValue.Function, title: t('knative-plugin~Functions') },
        { id: ServiceTypeValue.Service, title: t('knative-plugin~Non-functions') },
      ],
      reducer: filterReducer,
      filter: (filterValue, service) => {
        const functionIndicator = isServerlessFunction(service)
          ? ServiceTypeValue.Function
          : ServiceTypeValue.Service;
        return !filterValue?.selected?.length || filterValue?.selected.includes(functionIndicator);
      },
    },
  ];

  return (
    <>
      <DocumentTitle>{t('knative-plugin~Services')}</DocumentTitle>
      <ListPage
        canCreate
        {...props}
        kind={referenceForModel(ServiceModel)}
        ListComponent={ServiceList}
        rowFilters={filters}
      />
    </>
  );
};

export default ServicesPage;

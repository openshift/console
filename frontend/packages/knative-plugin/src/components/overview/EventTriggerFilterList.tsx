import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import FilterTable, { FilterTableRowProps } from './FilterTable';

type EventTriggerFilterListProps = {
  filters: FilterTableRowProps;
};

const EventTriggerFilterList: React.FC<EventTriggerFilterListProps> = ({ filters }) => {
  const { t } = useTranslation();
  return filters.length > 0 ? (
    <>
      <SidebarSectionHeading text={t('knative-plugin~Filter')} />
      <FilterTable filters={filters} />
    </>
  ) : null;
};

export default EventTriggerFilterList;

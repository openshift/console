import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import type { FilterTableRowProps } from './FilterTable';
import FilterTable from './FilterTable';

type EventTriggerFilterListProps = {
  filters: FilterTableRowProps;
};

const EventTriggerFilterList: FC<EventTriggerFilterListProps> = ({ filters }) => {
  const { t } = useTranslation();
  return filters.length > 0 ? (
    <>
      <SidebarSectionHeading text={t('knative-plugin~Filter')} />
      <FilterTable filters={filters} />
    </>
  ) : null;
};

export default EventTriggerFilterList;

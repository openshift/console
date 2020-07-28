import * as React from 'react';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import FilterTable, { FilterTableRowProps } from './FilterTable';

type EventTriggerFilterListProps = {
  filters: FilterTableRowProps;
};

const EventTriggerFilterList: React.FC<EventTriggerFilterListProps> = ({ filters }) => {
  return filters.length > 0 ? (
    <>
      <SidebarSectionHeading text="Filter" />
      <FilterTable filters={filters} />
    </>
  ) : null;
};

export default EventTriggerFilterList;

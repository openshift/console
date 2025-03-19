import * as React from 'react';
import {
  Switch,
  Divider,
  Select,
  SelectGroup,
  SelectList,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { DisplayFilters, TopologyDisplayFilterType, TopologyViewType } from '../topology-types';
import { EXPAND_GROUPS_FILTER_ID } from './const';

import './FilterDropdown.scss';

type FilterDropdownProps = {
  filters: DisplayFilters;
  viewType: TopologyViewType;
  supportedFilters: string[];
  onChange: (filter: DisplayFilters) => void;
  isDisabled?: boolean;
  opened?: boolean; // Use only for testing
};

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  filters,
  viewType,
  supportedFilters,
  onChange,
  isDisabled = false,
  opened = false,
}) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const [isOpen, setIsOpen] = React.useState(opened);
  const groupsExpanded = filters?.find((f) => f.id === EXPAND_GROUPS_FILTER_ID)?.value ?? true;

  const onToggle = (_event, open: boolean): void => setIsOpen(open);
  const onSelect = (e: React.MouseEvent, key: string) => {
    const index = filters.findIndex((f) => f.id === key);
    const filter = { ...filters[index], value: (e.target as HTMLInputElement).checked };
    onChange([...filters.slice(0, index), filter, ...filters.slice(index + 1)]);
    fireTelemetryEvent('Topology Display Option Changed', {
      property: key,
      value: (e.target as HTMLInputElement).checked,
    });
  };

  const onGroupsExpandedChange = (_event, value: boolean) => {
    const index = filters?.findIndex((f) => f.id === EXPAND_GROUPS_FILTER_ID) ?? -1;
    if (index === -1) {
      return;
    }
    const filter = {
      ...filters[index],
      value,
    };
    onChange([...filters.slice(0, index), filter, ...filters.slice(index + 1)]);
    fireTelemetryEvent('Topology Display Option Changed', {
      property: EXPAND_GROUPS_FILTER_ID,
      value,
    });
  };

  const expandFilters = filters
    .filter(
      (f) =>
        f.type === TopologyDisplayFilterType.expand &&
        f.id !== EXPAND_GROUPS_FILTER_ID &&
        supportedFilters.includes(f.id),
    )
    .sort((a, b) => a.priority - b.priority);

  const showFilters = filters
    .filter((f) => f.type === TopologyDisplayFilterType.show && supportedFilters.includes(f.id))
    .sort((a, b) => a.priority - b.priority);

  const isSelectDisabled =
    isDisabled ||
    (viewType === TopologyViewType.graph
      ? !expandFilters.length && !showFilters.length
      : !expandFilters.length);

  const selectContent = (
    <div className="odc-topology-filter-dropdown">
      {expandFilters.length ? (
        <div className="odc-topology-filter-dropdown__group">
          <span className="odc-topology-filter-dropdown__expand-groups-switcher">
            <span className="pf-v6-c-menu__group-title">{t('topology~Expand')}</span>
            <Switch
              aria-label={t('topology~Collapse groups')}
              isChecked={groupsExpanded}
              onChange={onGroupsExpandedChange}
            />
          </span>
          <SelectGroup className="odc-topology-filter-dropdown__expand-groups-label" label={<></>}>
            {expandFilters.map((filter) => (
              <SelectOption
                key={filter.id}
                value={filter.id}
                isDisabled={!groupsExpanded}
                isSelected={filter.value}
                hasCheckbox
              >
                {filter.labelKey ? t(filter.labelKey) : filter.label}
              </SelectOption>
            ))}
          </SelectGroup>
        </div>
      ) : null}
      {viewType === TopologyViewType.graph && showFilters.length ? (
        <div>
          <Divider />
          <SelectGroup label={t('topology~Show')}>
            {showFilters.map((filter) => (
              <SelectOption key={filter.id} value={filter.id} isSelected={filter.value} hasCheckbox>
                {filter.labelKey ? t(filter.labelKey) : filter.label}
              </SelectOption>
            ))}
          </SelectGroup>
        </div>
      ) : null}
    </div>
  );

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsOpen(!isOpen)}
      isExpanded={isOpen}
      isDisabled={isSelectDisabled}
    >
      {t('topology~Display options')}
    </MenuToggle>
  );

  return (
    <Select
      toggle={toggle}
      className="odc-topology-filter-dropdown__select"
      onToggle={onToggle}
      isOpen={isOpen}
      onSelect={onSelect}
      isGrouped
      isCheckboxSelectionBadgeHidden
      onOpenChange={(open) => setIsOpen(open)}
    >
      <SelectList>{selectContent}</SelectList>
    </Select>
  );
};

export default FilterDropdown;

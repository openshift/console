import * as React from 'react';
import {
  Button,
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceIcon } from '@console/internal/components/utils';
import { getTitleForNodeKind } from '@console/shared';
import { TopologyDisplayFilterType, DisplayFilters } from '../topology-types';
import './KindFilterDropdown.scss';

type KindFilterDropdownProps = {
  filters: DisplayFilters;
  supportedKinds: { [key: string]: number };
  onChange: (filter: DisplayFilters) => void;
  isDisabled?: boolean;
  opened?: boolean; // Use only for testing
};

const KindFilterDropdown: React.FC<KindFilterDropdownProps> = ({
  filters,
  supportedKinds,
  onChange,
  isDisabled = false,
  opened = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(opened);
  let kindFilters = filters.filter(
    (f) => f.type === TopologyDisplayFilterType.kind && supportedKinds[f.id],
  );
  const selectedFilterCount = kindFilters.filter((f) => f.value).length;
  kindFilters = Object.keys(supportedKinds).reduce((acc, kind) => {
    if (!filters.find((f) => f.id === kind)) {
      acc.push({
        type: TopologyDisplayFilterType.kind,
        id: kind,
        label: getTitleForNodeKind(kind),
        value: false,
        priority: 1,
      });
    }
    return acc;
  }, kindFilters);
  kindFilters.sort((a, b) => a.label.localeCompare(b.label));

  const onSelect = (e: React.MouseEvent, key: string) => {
    const index = filters.findIndex((f) => f.id === key);
    let updatedFilters;
    if (index === -1) {
      const newFilter = kindFilters.find((f) => f.id === key);
      if (!newFilter) {
        return;
      }
      const filter = { ...newFilter, value: (e.target as HTMLInputElement).checked };
      updatedFilters = [...filters, filter];
    } else {
      const filter = { ...filters[index], value: (e.target as HTMLInputElement).checked };
      updatedFilters = [...filters.slice(0, index), filter, ...filters.slice(index + 1)];
    }
    onChange(updatedFilters);
  };

  const onClearFilters = () => {
    const updateFilters = filters.filter((f) => f.type !== TopologyDisplayFilterType.kind);
    onChange(updateFilters);
  };

  const selectContent = (
    <div className="odc-topology-filter-dropdown__group odc-kind-filter-dropdown">
      <span className="odc-kind-filter-dropdown__clear-button">
        <Button variant="link" onClick={onClearFilters}>
          {t('topology~Clear all filters')}
        </Button>
      </span>
      {kindFilters.map((filter) => (
        <SelectOption
          key={filter.id}
          value={filter.id}
          isSelected={filter.value}
          data-test={filter.label}
          hasCheckbox
        >
          <ResourceIcon kind={filter.id} />
          {filter.label} ({supportedKinds[filter.id]})
        </SelectOption>
      ))}
    </div>
  );

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => setIsOpen(!isOpen)}
      isExpanded={isOpen}
      isDisabled={isDisabled}
    >
      {t('topology~Filter by resource')}
      {selectedFilterCount ? (
        <span className="odc-kind-filter-dropdown__kind-count">{selectedFilterCount}</span>
      ) : null}
    </MenuToggle>
  );

  return (
    <Select
      toggle={toggle}
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(open) => setIsOpen(open)}
    >
      <SelectList>{selectContent}</SelectList>
    </Select>
  );
};

export default KindFilterDropdown;

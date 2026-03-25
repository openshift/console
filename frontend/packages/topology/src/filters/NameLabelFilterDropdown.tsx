import type { FC, Ref } from 'react';
import { useState } from 'react';
import type { MenuToggleElement } from '@patternfly/react-core';
import { Select, SelectList, SelectOption, MenuToggle } from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { useTranslation } from 'react-i18next';
import AutocompleteInput from '@console/internal/components/autocomplete';
import { TextFilter } from '@console/internal/components/factory/text-filter';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { NameLabelFilterValues } from './filter-utils';

import './NameLabelFilterDropdown.scss';

type NameLabelFilterDropdownProps = {
  isDisabled: boolean;
  data: K8sResourceKind[];
  onChange: (type: string, value: string, endOfString: boolean) => void;
  nameFilterInput: string;
  labelFilterInput: string;
};

const NameLabelFilterDropdown: FC<NameLabelFilterDropdownProps> = (props) => {
  const { data, onChange, nameFilterInput, labelFilterInput, isDisabled } = props;

  const [isOpen, setOpen] = useState(false);
  const [selected, setSelected] = useState(NameLabelFilterValues.Name);

  const { t } = useTranslation();

  const onToggle = (_event, open: boolean) => setOpen(open);
  const dropdownItems = [NameLabelFilterValues.Name, NameLabelFilterValues.Label];

  const handleInputValue = (value: string) => {
    onChange(selected, value, false);
  };

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      id="toggle-id"
      ref={toggleRef}
      onClick={(_event) => {
        onToggle(_event, !isOpen);
      }}
      isDisabled={isDisabled}
      className="odc-topology-name-label-filter"
    >
      <>
        <FilterIcon className="span--icon__right-margin" /> {t(selected)}
      </>
    </MenuToggle>
  );

  return (
    <div className="pf-v6-c-input-group">
      <Select
        onSelect={(_event, value: NameLabelFilterValues) => {
          if (value) {
            setSelected(value as NameLabelFilterValues);
          }
          setOpen(false);
        }}
        toggle={toggle}
        isOpen={isOpen}
        onOpenChange={(open) => setOpen(open)}
      >
        <SelectList>
          {dropdownItems.map((item) => (
            <SelectOption key={item} value={item} isSelected={selected === item}>
              {t(item)}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
      {selected === NameLabelFilterValues.Label ? (
        <AutocompleteInput
          onSuggestionSelect={(label) => {
            onChange(NameLabelFilterValues.Label, label, true);
          }}
          showSuggestions
          textValue={labelFilterInput}
          setTextValue={handleInputValue}
          placeholder={t('topology~Find by label...')}
          data={data}
          color="purple"
          labelPath={'metadata.labels'}
        />
      ) : (
        <TextFilter
          onChange={(_event, value) => handleInputValue(value)}
          placeholder={t('topology~Find by name...')}
          value={nameFilterInput}
          aria-labelledby="toggle-id"
          isDisabled={isDisabled}
          autoFocus
        />
      )}
    </div>
  );
};

export default NameLabelFilterDropdown;

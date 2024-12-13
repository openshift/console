import * as React from 'react';
import {
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { useTranslation } from 'react-i18next';
import AutocompleteInput from '@console/internal/components/autocomplete';
import { TextFilter } from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { NameLabelFilterValues } from './filter-utils';

type NameLabelFilterDropdownProps = {
  isDisabled: boolean;
  data: K8sResourceKind[];
  onChange: (type: string, value: string, endOfString: boolean) => void;
  nameFilterInput: string;
  labelFilterInput: string;
};

const NameLabelFilterDropdown: React.FC<NameLabelFilterDropdownProps> = (props) => {
  const { data, onChange, nameFilterInput, labelFilterInput, isDisabled } = props;

  const [isOpen, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(NameLabelFilterValues.Name);

  const { t } = useTranslation();

  const onToggle = (_event, open: boolean) => setOpen(open);
  const dropdownItems = [NameLabelFilterValues.Name, NameLabelFilterValues.Label];

  const handleInputValue = (value: string) => {
    onChange(selected, value, false);
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      id="toggle-id"
      ref={toggleRef}
      onClick={(_event) => {
        onToggle(_event, !isOpen);
      }}
      isDisabled={isDisabled}
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
          className="co-text-node"
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

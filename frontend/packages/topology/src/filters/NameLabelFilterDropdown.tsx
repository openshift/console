import * as React from 'react';
import { Dropdown, DropdownToggle, DropdownItem } from '@patternfly/react-core';
import { CaretDownIcon, FilterIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import AutocompleteInput from '@console/internal/components/autocomplete';
import { TextFilter } from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { NameLabelFilterValues } from './filter-utils';

type NameLabelFilterDropdownProps = {
  data: K8sResourceKind[];
  onChange: (type: string, value: string, endOfString: boolean) => void;
  nameFilterInput: string;
  labelFilterInput: string;
};

const NameLabelFilterDropdown: React.FC<NameLabelFilterDropdownProps> = (props) => {
  const { data, onChange, nameFilterInput, labelFilterInput } = props;

  const [isOpen, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(NameLabelFilterValues.Name);

  const { t } = useTranslation();

  const onToggle = (open: boolean) => setOpen(open);
  const onSelect = (event: React.SyntheticEvent) => {
    setSelected((event.target as HTMLInputElement).name as NameLabelFilterValues);
    setOpen(!isOpen);
  };
  const dropdownItems = [
    <DropdownItem key="name-action" name={NameLabelFilterValues.Name} component="button">
      {t(NameLabelFilterValues.Name)}
    </DropdownItem>,
    <DropdownItem key="label-action" name={NameLabelFilterValues.Label} component="button">
      {t(NameLabelFilterValues.Label)}
    </DropdownItem>,
  ];

  const handleInputValue = (value: string) => {
    onChange(selected, value, false);
  };

  return (
    <div className="pf-c-input-group">
      <Dropdown
        onSelect={onSelect}
        toggle={
          <DropdownToggle id="toggle-id" onToggle={onToggle} toggleIndicator={CaretDownIcon}>
            <>
              <FilterIcon className="span--icon__right-margin" /> {t(selected)}
            </>
          </DropdownToggle>
        }
        isOpen={isOpen}
        dropdownItems={dropdownItems}
      />
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
          onChange={handleInputValue}
          placeholder={t('topology~Find by name...')}
          value={nameFilterInput}
          aria-labelledby="toggle-id"
        />
      )}
    </div>
  );
};

export default NameLabelFilterDropdown;

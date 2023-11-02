import * as React from 'react';
import {
  Dropdown as DropdownDeprecated,
  DropdownToggle as DropdownToggleDeprecated,
  DropdownItem as DropdownItemDeprecated,
} from '@patternfly/react-core/deprecated';
import { CaretDownIcon } from '@patternfly/react-icons/dist/esm/icons/caret-down-icon';
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
  const onSelect = (event: React.SyntheticEvent) => {
    setSelected((event.target as HTMLInputElement).name as NameLabelFilterValues);
    setOpen(!isOpen);
  };
  const dropdownItems = [
    <DropdownItemDeprecated key="name-action" name={NameLabelFilterValues.Name} component="button">
      {t(NameLabelFilterValues.Name)}
    </DropdownItemDeprecated>,
    <DropdownItemDeprecated
      key="label-action"
      name={NameLabelFilterValues.Label}
      component="button"
    >
      {t(NameLabelFilterValues.Label)}
    </DropdownItemDeprecated>,
  ];

  const handleInputValue = (value: string) => {
    onChange(selected, value, false);
  };

  return (
    <div className="pf-v5-c-input-group">
      <DropdownDeprecated
        onSelect={onSelect}
        toggle={
          <DropdownToggleDeprecated
            isDisabled={isDisabled}
            id="toggle-id"
            onToggle={onToggle}
            toggleIndicator={CaretDownIcon}
          >
            <>
              <FilterIcon className="span--icon__right-margin" /> {t(selected)}
            </>
          </DropdownToggleDeprecated>
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

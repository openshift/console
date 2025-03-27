import * as React from 'react';
import {
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectOption,
  SelectProps,
  TextInputGroup,
  TextInputGroupMain,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const SingleSelectDropdown: React.FC<SingleSelectDropdownProps> = ({
  onChange,
  selectOptions,
  selectedKey = '',
  valueLabelMap,
  ...props
}) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [newOptions, setNewOptions] = React.useState<JSX.Element[]>([]);
  const textInputRef = React.useRef<HTMLInputElement>(null);

  // Get all options (original + created)
  const allOptions = React.useMemo(
    () => (newOptions.length > 0 ? selectOptions.concat(newOptions) : selectOptions),
    [selectOptions, newOptions],
  );

  // Filtered options based on input value
  const [filteredOptions, setFilteredOptions] = React.useState(allOptions);

  // Filter options when input changes
  React.useEffect(() => {
    if (inputValue) {
      // Filter options based on input text
      const filtered = allOptions.filter((option) => {
        const optionText = option.props.children?.toString().toLowerCase();
        return optionText?.includes(inputValue.toLowerCase());
      });
      setFilteredOptions(filtered);

      // Open dropdown when typing
      if (!isOpen) {
        setOpen(true);
      }
    } else {
      setFilteredOptions(allOptions);
    }
  }, [inputValue, allOptions, isOpen]);

  const onSelect = React.useCallback(
    (_event: React.MouseEvent | React.ChangeEvent, selection: string) => {
      // Find the selected value based on valueLabelMap if provided
      const value = valueLabelMap
        ? Object.keys(valueLabelMap).find((key) => valueLabelMap[key] === selection)
        : selection;

      onChange(value);
      setOpen(false);
      setInputValue('');
    },
    [valueLabelMap, onChange],
  );

  const onCreateOption = (newValue: string) => {
    setNewOptions([
      ...newOptions,
      <SelectOption key={newValue} value={newValue}>
        {newValue}
      </SelectOption>,
    ]);
    // Auto-select the newly created value
    if (props.isCreatable) {
      onChange(newValue);
      setInputValue('');
    }
  };

  // Handle text input change
  const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value);
  };

  // Handle input click
  const onInputClick = () => {
    if (!isOpen) {
      setOpen(true);
    }
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      variant="typeahead"
      onClick={() => {
        setOpen(!isOpen);
        textInputRef.current?.focus();
      }}
      isExpanded={isOpen}
      id={`${props.id}-toggle`}
      isFullWidth
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={inputValue}
          placeholder={
            selectedKey
              ? valueLabelMap
                ? valueLabelMap[selectedKey]
                : selectedKey
              : props?.placeholderText || t('Select options')
          }
          onChange={onTextInputChange}
          onClick={onInputClick}
          innerRef={textInputRef}
          autoComplete="off"
          id={`${props.id}-input`}
          aria-controls={`${props.id}-select`}
          role="combobox"
          isExpanded={isOpen}
        />
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <div className="test">
      <Select
        {...props}
        variant="typeahead"
        aria-label={t('Select input')}
        onSelect={onSelect}
        selections={selectedKey}
        isOpen={isOpen}
        shouldFocusToggleOnSelect
        placeholderText={props?.placeholderText || t('Select options')}
        aria-labelledby={props?.id}
        noResultsFoundText={t('No results found')}
        onCreateOption={(props?.isCreatable && onCreateOption) || undefined}
        toggle={toggle}
        onOpenChange={(newIsOpen) => setOpen(newIsOpen)}
      >
        {filteredOptions}
      </Select>
    </div>
  );
};

export type SingleSelectDropdownProps = {
  id?: string;
  selectedKey?: string;
  placeholderText?: string;
  valueLabelMap?: { [key: string]: string };
  className?: string;
  selectOptions: JSX.Element[];
  onChange: (selected: string) => void;
  onFilter?: SelectProps['onSelect'];
  isDisabled?: boolean;
  validated?: 'success' | 'warning' | 'error' | 'default';
  required?: boolean;
  isCreatable?: boolean;
};

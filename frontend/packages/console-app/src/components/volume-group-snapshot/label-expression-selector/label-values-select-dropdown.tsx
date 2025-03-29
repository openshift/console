import * as React from 'react';
import {
  Label,
  LabelGroup,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  SelectProps,
  TextInputGroup,
  TextInputGroupMain,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const LabelValueSelectDropdown: React.FC<LabelValueSelectDropdownProps> = ({
  onChange,
  placeholderText,
  id,
  options,
  selectOptions,
  selections = [],
  isCreatable,
  ...rest
}) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [newOptions, setNewOptions] = React.useState<JSX.Element[]>([]);
  const textInputRef = React.useRef<HTMLInputElement>(null);

  // Create items from options if provided
  const items: JSX.Element[] = options?.map((item) => (
    <SelectOption key={item} value={item} hasCheckbox isSelected={selections.includes(item)}>
      {item}
    </SelectOption>
  ));

  // Combine all options (original + created)
  const allAvailableOptions =
    newOptions.length > 0 ? (selectOptions || items).concat(newOptions) : selectOptions || items;

  // Filtered options based on input value
  const [filteredOptions, setFilteredOptions] = React.useState(allAvailableOptions);

  // Filter options when input changes
  React.useEffect(() => {
    if (inputValue) {
      // Filter options based on input text
      const filtered = allAvailableOptions.filter((option) => {
        const optionText = option.props.children?.toString().toLowerCase();
        return optionText?.includes(inputValue.toLowerCase());
      });
      setFilteredOptions(filtered);

      // Open dropdown when typing
      if (!isOpen) {
        setOpen(true);
      }
    } else {
      setFilteredOptions(allAvailableOptions);
    }
  }, [inputValue, allAvailableOptions, isOpen]);

  const onToggleClick = () => {
    setOpen(!isOpen);
    if (!isOpen) {
      textInputRef.current?.focus();
    }
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    selection: string | number | undefined,
  ) => {
    const prevSelection = selections as string[];
    let cSelected = prevSelection;
    if (prevSelection.includes(selection as string)) {
      cSelected = prevSelection.filter((item) => item !== selection);
    } else {
      cSelected = [...prevSelection, selection as string];
    }
    onChange(cSelected, selection as string);
  };

  const onCreateOption = (newValue: string) => {
    setNewOptions([
      ...newOptions,
      <SelectOption key={newValue} value={newValue} hasCheckbox isSelected={false}>
        {newValue}
      </SelectOption>,
    ]);

    // Auto-select the newly created option
    if (isCreatable) {
      const newSelections = [...selections, newValue];
      onChange(newSelections, newValue);
    }

    setInputValue(''); // Clear input after creation
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

  // Remove a selected item
  const removeSelection = (selection: string) => {
    const newSelections = selections.filter((item) => item !== selection);
    onChange(newSelections, selection);
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      variant="typeahead"
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isOpen}
      id={`${id}-toggle`}
      isFullWidth
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={inputValue}
          placeholder={placeholderText || t('Select options')}
          onChange={onTextInputChange}
          onClick={onInputClick}
          innerRef={textInputRef}
          autoComplete="off"
          id={`${id}-input`}
          aria-controls={`${id}-select`}
          role="combobox"
          isExpanded={isOpen}
        >
          {selections.length > 0 && (
            <LabelGroup>
              {selections.map((item) => (
                <Label key={item} onClose={() => removeSelection(item)} variant="outline">
                  {item}
                </Label>
              ))}
            </LabelGroup>
          )}
        </TextInputGroupMain>
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <Select
      id={id}
      variant="typeahead"
      isOpen={isOpen}
      selected={selections}
      onSelect={onSelect}
      onOpenChange={(nextOpen: boolean) => setOpen(nextOpen)}
      onCreateOption={(isCreatable && onCreateOption) || undefined}
      isCreatable={isCreatable}
      toggle={toggle}
      {...rest}
    >
      <SelectList>{filteredOptions}</SelectList>
    </Select>
  );
};

export type LabelValueSelectDropdownProps = Omit<
  SelectProps,
  'onChange' | 'onToggle' | 'toggle'
> & {
  id?: string;
  options?: string[];
  selectOptions?: JSX.Element[];
  onChange: (selected: string[], selection?: string) => void;
  isCreatable?: boolean;
  selections: string[];
  placeholderText?: string;
};

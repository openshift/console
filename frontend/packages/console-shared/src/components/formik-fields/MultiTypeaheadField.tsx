import * as React from 'react';
import {
  Label,
  LabelGroup,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Select,
  SelectOption,
  SelectList,
  SelectOptionProps,
  MenuToggle,
  MenuToggleElement,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Button,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons/dist/esm/icons/times-icon';
import { useField, useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useFormikValidationFix } from '../../hooks';
import { RedExclamationCircleIcon } from '../status';
import { MultiTypeaheadFieldProps } from './field-types';
import { getFieldId } from './field-utils';

const MultiTypeaheadField: React.FC<MultiTypeaheadFieldProps> = ({
  name,
  label,
  ariaLabel,
  options,
  placeholderText,
  isCreatable,
  helpText,
  required,
  isInputValuePersisted,
  noResultsFoundText,
  toggleOnSelection,
  hideClearButton,
  isDisabled,
  onChange,
  getLabelFromValue,
}) => {
  const [initialSelectOptions, setInitialSelectOptions] = React.useState<SelectOptionProps[]>(
    _.map(options, (option) => ({
      value: option.value,
      description: option.description,
      children: option.label || option.value,
      isDisabled: option.disabled,
    })),
  );

  const { t } = useTranslation();

  const [field, { touched, error }] = useField<string[]>(name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const fieldId = getFieldId(name, 'select-input');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  const [inputValue, setInputValue] = React.useState<string>('');
  const [filteredSelectOptions, setFilteredSelectOptions] = React.useState<SelectOptionProps[]>(
    initialSelectOptions,
  );
  const [focusedItemIndex, setFocusedItemIndex] = React.useState<number | null>(null);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);
  const [onCreation, setOnCreation] = React.useState<boolean>(false); // Boolean to refresh filter state after new option is created
  const textInputRef = React.useRef<HTMLInputElement>();

  useFormikValidationFix(field.value);

  const ID_PREFIX = _.uniqueId('select-multi-typeahead-'); // for aria to work, ids have to be unique
  const NO_RESULTS = 'multi_typeahead-dropdown__no-results';
  const CREATE_NEW = 'multi_typeahead-dropdown__create-new';

  const createItemId = (value: any) => `${ID_PREFIX}-value-${value.replace(' ', '-')}`;

  React.useEffect(() => {
    let newSelectOptions: SelectOptionProps[] = initialSelectOptions;

    // Filter menu items based on the text input value when one exists
    if (inputValue) {
      newSelectOptions = initialSelectOptions.filter((menuItem) =>
        String(menuItem.children).toLowerCase().includes(inputValue.toLowerCase()),
      );

      // If no option matches the filter exactly, display creation option
      if (isCreatable && !initialSelectOptions.some((option) => option.value === inputValue)) {
        newSelectOptions = [
          ...newSelectOptions,
          {
            children: t('console-shared~Create new option "{{option}}"', { option: inputValue }),
            value: CREATE_NEW,
          },
        ];
      }

      // Open the menu when the input value changes and the new value is not empty
      if (!isOpen) {
        setIsOpen(true);
      }
    }

    setFilteredSelectOptions(newSelectOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, onCreation]);

  const setActiveAndFocusedItem = (itemIndex: number) => {
    setFocusedItemIndex(itemIndex);
    const focusedItem = filteredSelectOptions[itemIndex];
    setActiveItemId(createItemId(focusedItem.value));
  };

  const resetActiveAndFocusedItem = () => {
    setFocusedItemIndex(null);
    setActiveItemId(null);
  };

  const closeMenu = () => {
    setIsOpen(false);
    resetActiveAndFocusedItem();
    !isInputValuePersisted && setInputValue('');
  };

  const onInputClick = () => {
    if (!isOpen) {
      setIsOpen(true);
    } else if (!inputValue) {
      closeMenu();
    }
  };

  const onToggleClick = () => {
    setIsOpen(!isOpen);
    textInputRef?.current?.focus();
  };

  const onSelect = (value: string) => {
    if (onChange) {
      onChange(value);
    } else if (isCreatable && value === CREATE_NEW) {
      const hasDuplicateOption = [...filteredSelectOptions, ...options].find(
        (option) => option.value === inputValue,
      );

      if (!hasDuplicateOption) {
        setInitialSelectOptions([
          ...initialSelectOptions,
          { value: inputValue, children: inputValue },
        ]);
        setFieldValue(name, [...field.value, inputValue]);
        setInputValue('');
      }

      setOnCreation(!onCreation);
      resetActiveAndFocusedItem();
    } else if (value) {
      const selections = field.value;
      if (_.includes(selections, value)) {
        setFieldValue(name, _.pull(selections, value));
      } else {
        setFieldValue(name, [...selections, value]);
      }
    }

    setFieldTouched(name);
    toggleOnSelection && onToggleClick();

    textInputRef.current?.focus();
  };

  const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value);
    resetActiveAndFocusedItem();
  };

  const handleMenuArrowKeys = (key: string) => {
    let indexToFocus = 0;

    if (!isOpen) {
      setIsOpen(true);
    }

    if (filteredSelectOptions.every((option) => option.isDisabled)) {
      return;
    }

    if (key === 'ArrowUp') {
      // When no index is set or at the first index, focus to the last, otherwise decrement focus index
      if (focusedItemIndex === null || focusedItemIndex === 0) {
        indexToFocus = filteredSelectOptions.length - 1;
      } else {
        indexToFocus = focusedItemIndex - 1;
      }

      // Skip disabled options
      while (filteredSelectOptions[indexToFocus].isDisabled) {
        indexToFocus--;
        if (indexToFocus === -1) {
          indexToFocus = filteredSelectOptions.length - 1;
        }
      }
    }

    if (key === 'ArrowDown') {
      // When no index is set or at the last index, focus to the first, otherwise increment focus index
      if (focusedItemIndex === null || focusedItemIndex === filteredSelectOptions.length - 1) {
        indexToFocus = 0;
      } else {
        indexToFocus = focusedItemIndex + 1;
      }

      // Skip disabled options
      while (filteredSelectOptions[indexToFocus].isDisabled) {
        indexToFocus++;
        if (indexToFocus === filteredSelectOptions.length) {
          indexToFocus = 0;
        }
      }
    }

    setActiveAndFocusedItem(indexToFocus);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const focusedItem = focusedItemIndex !== null ? filteredSelectOptions[focusedItemIndex] : null;

    switch (event.key) {
      case 'Enter':
        if (isOpen && focusedItem && !focusedItem.isAriaDisabled) {
          onSelect(focusedItem.value as string);
        }

        if (!isOpen) {
          setIsOpen(true);
        }

        break;
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        handleMenuArrowKeys(event.key);
        break;
      default:
        break;
    }
  };

  const onClearButtonClick = () => {
    setFieldValue(name, []);
    setFieldTouched(name);

    setInputValue('');
    resetActiveAndFocusedItem();
    textInputRef?.current?.focus();
  };

  const getChildren = (value: string) =>
    initialSelectOptions.find((option) => option.value === value)?.children ||
    (getLabelFromValue && getLabelFromValue(value)) ||
    value;

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      variant="typeahead"
      onClick={onToggleClick}
      innerRef={toggleRef}
      isExpanded={isOpen}
      isFullWidth
      isDisabled={isDisabled}
      status={isValid ? undefined : 'danger'}
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={inputValue}
          onClick={onInputClick}
          onChange={onTextInputChange}
          onKeyDown={(ev: React.KeyboardEvent<HTMLInputElement>) => {
            ev.key === 'Enter' && ev.preventDefault(); // prevent accidental form submission
            onInputKeyDown(ev);
          }}
          id={ID_PREFIX}
          autoComplete="off"
          innerRef={textInputRef}
          placeholder={placeholderText}
          {...(activeItemId && { 'aria-activedescendant': activeItemId })}
          role="combobox"
          isExpanded={isOpen}
          aria-label={ariaLabel}
          aria-controls={`${ID_PREFIX}-listbox`}
        >
          <LabelGroup aria-label={t('console-shared~Current selections')}>
            {field.value.map((selection) => (
              <Label
                variant="outline"
                key={selection}
                onClose={(ev) => {
                  ev.stopPropagation();
                  onSelect(selection);
                }}
                closeBtnAriaLabel={t('console-shared~Remove {{singularLabel}}', {
                  singularLabel: getChildren(selection),
                })}
              >
                {getChildren(selection)}
              </Label>
            ))}
          </LabelGroup>
        </TextInputGroupMain>
        {!hideClearButton && (
          <TextInputGroupUtilities
            {...(field.value.length === 0 ? { style: { display: 'none' } } : {})}
          >
            <Button
              icon={<TimesIcon aria-hidden />}
              variant="plain"
              onClick={onClearButtonClick}
              aria-label={t('console-shared~Clear filter')}
            />
          </TextInputGroupUtilities>
        )}
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired={required}>
      <Select
        id={ID_PREFIX}
        isOpen={isOpen}
        selected={field.value}
        onSelect={(_event, selection) => onSelect(selection as string)}
        onOpenChange={(open) => {
          !open && closeMenu();
        }}
        toggle={toggle}
        shouldFocusFirstItemOnOpen={false}
        popperProps={{
          maxWidth: 'trigger',
        }}
      >
        <SelectList isAriaMultiselectable id={`${ID_PREFIX}-listbox`}>
          {filteredSelectOptions.map((option, index) => (
            <SelectOption
              key={option.value}
              isFocused={focusedItemIndex === index}
              className={option.className}
              id={createItemId(option.value)}
              {...option}
              ref={null}
            >
              {option.children || getChildren(option.value)}
            </SelectOption>
          ))}
          {(!isCreatable || !inputValue) && filteredSelectOptions.length === 0 && (
            <SelectOption isDisabled id={NO_RESULTS}>
              {noResultsFoundText || t('console-shared~No results found')}
            </SelectOption>
          )}
        </SelectList>
      </Select>

      <FormHelperText>
        <HelperText>
          {!isValid ? (
            <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />}>
              {errorMessage}
            </HelperTextItem>
          ) : (
            <HelperTextItem>{helpText}</HelperTextItem>
          )}
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default MultiTypeaheadField;

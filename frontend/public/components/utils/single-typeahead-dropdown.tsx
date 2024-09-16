import {
  Button,
  MenuToggle,
  MenuToggleProps,
  MenuToggleElement,
  Select,
  SelectProps,
  SelectList,
  SelectOption,
  SelectOptionProps,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from '@patternfly/react-core';
import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TimesIcon } from '@patternfly/react-icons/dist/esm/icons/times-icon';

export type SingleTypeaheadDropdownProps = {
  /** The items to display in the dropdown */
  items: SelectOptionProps[];
  /** The component to use render the dropdown options */
  OptionComponent: React.FC<SelectOptionProps>;
  /** The function to call when the selected item changes */
  onChange: (v: string) => void;
  /** The key of the selected item */
  selectedKey: string;
  /** The placeholder text to display in the input */
  placeholder?: string;
  /** Whether to hide the clear button */
  hideClearButton?: boolean;
  /** Whether to resize the dropdown to fit the selected item */
  resizeToFit?: boolean;
  /** Whether to enable creating new items */
  enableCreateNew?: boolean;

  /** Additional props to pass to MenuToggle */
  menuToggleProps?: MenuToggleProps;
  /** Additional props to pass to Select */
  selectProps?: SelectProps;
};

/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 *
 * @param {String} text - The text to be rendered.
 * @param {String} font - The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 *
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
const getTextWidth = (text: string, font: string): number => {
  // re-use canvas object for better performance
  const canvas: HTMLCanvasElement =
    // @ts-ignore
    getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
  const context = canvas.getContext('2d');
  context.font = font;
  const metrics = context.measureText(text);
  return Math.ceil(metrics.width);
};

/** A PF Select with typeahead filtering and single selection */
export const SingleTypeaheadDropdown: React.FC<SingleTypeaheadDropdownProps> = ({
  items,
  onChange,
  OptionComponent = SelectOption,
  selectedKey,
  placeholder,
  hideClearButton = false,
  enableCreateNew = false,
  resizeToFit = false,
  menuToggleProps = {},
  selectProps = {},
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedValue = React.useMemo(() => items.find((i) => i.value === selectedKey), [
    items,
    selectedKey,
  ]);
  const [inputValue, setInputValue] = React.useState<string>(selectedValue?.children || '');
  const [filterValue, setFilterValue] = React.useState<string>('');
  const [selectOptions, setSelectOptions] = React.useState<SelectOptionProps[]>(items);
  const [focusedItemIndex, setFocusedItemIndex] = React.useState<number | null>(null);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);
  const textInputRef = React.useRef<HTMLInputElement>();

  const ID_PREFIX = _.uniqueId('select-typeahead-'); // for aria to work, ids have to be unique
  const NO_RESULTS = 'typeahead-dropdown__no-results';
  const CREATE_NEW = 'typeahead-dropdown__create-new';

  React.useEffect(() => {
    let newSelectOptions: SelectOptionProps[] = items;

    // Filter menu items based on the text input value when one exists
    if (filterValue) {
      newSelectOptions = items.filter((menuItem) =>
        String(menuItem.children).toLowerCase().includes(filterValue.toLowerCase()),
      );

      // Open the menu when the input value changes and the new value is not empty
      if (!isOpen) {
        setIsOpen(true);
      }
    }

    setSelectOptions(newSelectOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterValue]);

  const createItemId = (value: any) => `${ID_PREFIX}-${String(value).replace(' ', '-')}`;

  const setActiveAndFocusedItem = (itemIndex: number) => {
    setFocusedItemIndex(itemIndex);
    const focusedItem = selectOptions[itemIndex];
    setActiveItemId(createItemId(focusedItem.value));
  };

  const resetActiveAndFocusedItem = () => {
    setFocusedItemIndex(null);
    setActiveItemId(null);
  };

  const closeMenu = () => {
    setIsOpen(false);
    resetActiveAndFocusedItem();
  };

  const onInputClick = () => {
    if (!isOpen) {
      setIsOpen(true);
    } else if (!inputValue) {
      closeMenu();
    }
  };

  const selectOption = (value: string | number, content: string | number) => {
    setInputValue(String(content));
    setFilterValue('');
    onChange(String(value));

    closeMenu();
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    if (enableCreateNew && filterValue && value === CREATE_NEW) {
      if (!selectOptions.some((item) => item.children === filterValue)) {
        setSelectOptions([...selectOptions, { value: filterValue, children: filterValue }]);
      }
      selectOption(filterValue, filterValue);
      setFilterValue('');
      closeMenu();
    } else if (value && value !== NO_RESULTS) {
      selectOption(value, items[value]);
    }
  };

  React.useEffect(() => {
    setInputValue(selectedValue?.children || '');
  }, [selectedValue]);

  const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value);
    setFilterValue(value);

    resetActiveAndFocusedItem();
  };

  const handleMenuArrowKeys = (key: string) => {
    let indexToFocus = 0;

    if (!isOpen) {
      setIsOpen(true);
    }

    if (selectOptions.every((option) => option.isDisabled)) {
      return;
    }

    if (key === 'ArrowUp') {
      // When no index is set or at the first index, focus to the last, otherwise decrement focus index
      if (focusedItemIndex === null || focusedItemIndex === 0) {
        indexToFocus = selectOptions.length - 1;
      } else {
        indexToFocus = focusedItemIndex - 1;
      }

      // Skip disabled options
      while (selectOptions[indexToFocus].isDisabled) {
        indexToFocus--;
        if (indexToFocus === -1) {
          indexToFocus = selectOptions.length - 1;
        }
      }
    }

    if (key === 'ArrowDown') {
      // When no index is set or at the last index, focus to the first, otherwise increment focus index
      if (focusedItemIndex === null || focusedItemIndex === selectOptions.length - 1) {
        indexToFocus = 0;
      } else {
        indexToFocus = focusedItemIndex + 1;
      }

      // Skip disabled options
      while (selectOptions[indexToFocus].isDisabled) {
        indexToFocus++;
        if (indexToFocus === selectOptions.length) {
          indexToFocus = 0;
        }
      }
    }

    setActiveAndFocusedItem(indexToFocus);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const focusedItem = focusedItemIndex !== null ? selectOptions[focusedItemIndex] : null;

    switch (event.key) {
      case 'Enter':
        if (
          isOpen &&
          focusedItem &&
          focusedItem.value !== NO_RESULTS &&
          !focusedItem.isAriaDisabled
        ) {
          selectOption(focusedItem.value, focusedItem.children as string);
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

  const onToggleClick = () => {
    setIsOpen(!isOpen);
    textInputRef?.current?.focus();
  };

  const onClearButtonClick = () => {
    onChange('');
    setInputValue('');
    setFilterValue('');
    resetActiveAndFocusedItem();
    textInputRef?.current?.focus();
  };

  const selectedItemWidth = React.useMemo(() => {
    // hardcoded as canvas can't access CSS variables scoped to the component
    return (
      resizeToFit &&
      selectedValue &&
      getTextWidth(String(selectedValue.children), '14px RedHatText')
    );
  }, [resizeToFit, selectedValue, items]);

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      variant="typeahead"
      onClick={onToggleClick}
      isExpanded={isOpen}
      {...menuToggleProps}
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={inputValue}
          onClick={onInputClick}
          onChange={onTextInputChange}
          onKeyDown={onInputKeyDown}
          id={`${ID_PREFIX}-input`}
          autoComplete="off"
          innerRef={textInputRef}
          placeholder={placeholder ?? t('public~Filter options')}
          {...(activeItemId && { 'aria-activedescendant': activeItemId })}
          role="combobox"
          isExpanded={isOpen}
          aria-controls={`${ID_PREFIX}-listbox`}
          style={
            resizeToFit
              ? {
                  width: `calc(${selectedItemWidth}px + var(--pf-v5-c-text-input-group__text-input--PaddingLeft) + var(--pf-v5-c-text-input-group__text-input--PaddingRight))`,
                }
              : {}
          }
        />
        {!hideClearButton && (
          <TextInputGroupUtilities {...(!inputValue ? { style: { display: 'none' } } : {})}>
            <Button
              variant="plain"
              onClick={onClearButtonClick}
              aria-label={t('public~Clear query')}
            >
              <TimesIcon aria-hidden />
            </Button>
          </TextInputGroupUtilities>
        )}
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <Select
      id={ID_PREFIX}
      isOpen={isOpen}
      selected={selectedKey}
      onSelect={onSelect}
      onOpenChange={(open) => {
        open ? setIsOpen(true) : closeMenu();
      }}
      toggle={toggle}
      shouldFocusFirstItemOnOpen={false}
      {...selectProps}
    >
      <SelectList id={`${ID_PREFIX}-listbox`}>
        {selectOptions.map((v, k) => (
          <OptionComponent
            key={k}
            isSelected={selectedKey === v.value}
            isFocused={focusedItemIndex === k}
            id={createItemId(k)}
            value={v.value}
            {...v}
          />
        ))}
        {_.isEmpty(selectOptions) && filterValue && (
          <>
            {!enableCreateNew && (
              <SelectOption isDisabled={true} isAriaDisabled={true} value={NO_RESULTS}>
                {t(`public~No results found`)}
              </SelectOption>
            )}

            {enableCreateNew && (
              <SelectOption value={CREATE_NEW}>
                {t(`public~Create new option {{option}}`, { option: filterValue })}
              </SelectOption>
            )}
          </>
        )}
      </SelectList>
    </Select>
  );
};

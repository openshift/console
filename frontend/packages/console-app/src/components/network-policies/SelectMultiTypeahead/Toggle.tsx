import * as React from 'react';
import {
  Button,
  ButtonVariant,
  Chip,
  ChipGroup,
  MenuToggle,
  MenuToggleElement,
  SelectOptionProps,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { NO_RESULTS_VALUE } from './constants';
import { handleMenuArrowKeys } from './utils';

type ToggleProps = {
  focusedItemIndex: null | number;
  inputValue: string;
  isOpen: boolean;
  onSelect: (value: string) => void;
  placeholder: string;
  selected: string[];
  selectOptions: SelectOptionProps[];
  setFocusedItemIndex: (newValue: null | number) => void;
  setInputValue: (newInput: string) => void;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelected: (newSelection: string[]) => void;
  textInputRef: React.RefObject<any>;
  toggleRef: React.Ref<MenuToggleElement>;
};

const Toggle: React.FC<ToggleProps> = ({
  focusedItemIndex,
  inputValue,
  isOpen,
  onSelect,
  placeholder,
  selected,
  selectOptions,
  setFocusedItemIndex,
  setInputValue,
  setIsOpen,
  setSelected,
  textInputRef,
  toggleRef,
}) => {
  const { t } = useTranslation();

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const enabledMenuItems = selectOptions.filter((menuItem) => !menuItem.isDisabled);
    const [firstMenuItem] = enabledMenuItems;
    const focusedItem = focusedItemIndex ? enabledMenuItems?.[focusedItemIndex] : firstMenuItem;

    switch (event.key) {
      // Select the first available option
      case 'Enter':
        if (!isOpen) {
          setIsOpen((prevIsOpen) => !prevIsOpen);
          return;
        }

        if (isOpen && focusedItem.value !== NO_RESULTS_VALUE) {
          onSelect(focusedItem.value as string);
        }

        break;
      case 'Tab':
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();

        if (isOpen) {
          const indexToFocus = handleMenuArrowKeys(event.key, focusedItemIndex, selectOptions);

          if (indexToFocus !== null) setFocusedItemIndex(indexToFocus);
        }
        break;
      default:
        break;
    }
  };

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value);
    setFocusedItemIndex(null);

    if (value) setIsOpen(true);
  };

  return (
    <MenuToggle
      innerRef={toggleRef}
      isExpanded={isOpen}
      isFullWidth
      onClick={onToggleClick}
      variant="typeahead"
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          aria-controls="select-multi-typeahead-listbox"
          autoComplete="off"
          id="multi-typeahead-select-input"
          innerRef={textInputRef}
          isExpanded={isOpen}
          onChange={onTextInputChange}
          onClick={onToggleClick}
          onKeyDown={onInputKeyDown}
          placeholder={placeholder}
          role="combobox"
          value={inputValue}
        >
          <ChipGroup aria-label={t('console-app~Current selections')}>
            {selected.map((selection) => (
              <Chip
                key={selection}
                onClick={(ev) => {
                  ev.stopPropagation();
                  onSelect(selection);
                }}
              >
                {selection}
              </Chip>
            ))}
          </ChipGroup>
        </TextInputGroupMain>
        <TextInputGroupUtilities>
          {!isEmpty(selected) && (
            <Button
              aria-label={t('console-app~Clear input value')}
              onClick={() => {
                setInputValue('');
                setSelected([]);
                textInputRef?.current?.focus();
              }}
              variant={ButtonVariant.plain}
            >
              <TimesIcon aria-hidden />
            </Button>
          )}
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  );
};

export default Toggle;

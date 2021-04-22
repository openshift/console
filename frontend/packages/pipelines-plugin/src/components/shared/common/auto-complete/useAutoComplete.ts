import * as React from 'react';
import * as _ from 'lodash';
import { CursorPosition, insertIntoValue } from './autoCompleteUtils';

type ElementType = HTMLInputElement | HTMLTextAreaElement;
type AutoCompleteHook = {
  contentRefCallback: (contentNode: ElementType) => void;
  focusTrapProps: {
    active: boolean;
    focusTrapOptions: {
      clickOutsideDeactivates: boolean;
      onDeactivate: () => void;
      fallbackFocus: ElementType;
    };
  };
  insertAutoComplete: (newValue: string) => void;
  menuWidth: number;
  options: string[];
  popperProps: {
    open: boolean;
    onRequestClose: () => void;
    reference: () => ElementType;
  };
};

type ShouldOpenCallback = (event) => boolean;
type MenuKeyWatcherHook = {
  isOpen: boolean;
  shouldOpen: ShouldOpenCallback;
  closeMenu: () => void;
};

type SetAutoCompleteCallback = (newValue: string) => void;

type SetFilterOptions = (filterValue: string) => void;
type FilterOptionsHook = [string[], SetFilterOptions];

const PARAM_REFERENCE = '$(';
const PARAM_REFERENCE_CHARS = PARAM_REFERENCE.split('');

/**
 * Tracks open state + manages keystrokes to open.
 */
const useOpenMenuKeyWatcher = (): MenuKeyWatcherHook => {
  const [isOpen, setOpen] = React.useState<boolean>(false);

  const shouldOpen = React.useCallback<ShouldOpenCallback>(
    (event) => {
      const { key, code, ctrlKey } = event;

      if (code === 'Space' && ctrlKey) {
        // Hotkey to open
        setOpen(true);
        return true;
      }

      if (!PARAM_REFERENCE_CHARS.includes(key) || isOpen) {
        // Ignore event, does not apply to opening
        return false;
      }

      const cursorPos = event.target.selectionStart;
      // Go back the character we added and then one more to get the previous character
      const lastCharacter = event.target.value[cursorPos - 2];

      if (lastCharacter === PARAM_REFERENCE_CHARS[0] && key === PARAM_REFERENCE_CHARS[1]) {
        // Manual open
        setOpen(true);
        return true;
      }

      return false;
    },
    [isOpen],
  );

  return { isOpen, shouldOpen, closeMenu: React.useCallback(() => setOpen(false), []) };
};

/**
 * Filters options that are provided based on a setFilter.
 */
const useFilterOptions = (options: string[]): FilterOptionsHook => {
  type FilterMap = { [singleValue: string]: string };

  const [filteredOptions, setFilteredOptions] = React.useState<string[]>(options);
  const filterMappings = React.useRef<FilterMap>({});

  React.useEffect(() => {
    filterMappings.current = options.reduce((acc: FilterMap, option: string, idx: number) => {
      const optionPartMap = option.split('.').reduce((optionAcc, optionPart: string) => {
        return {
          ...optionAcc,
          // startsWith value + unique identifier to allow multiple overlapping parts
          [`${optionPart}|${idx}`]: option,
        };
      }, {});

      return {
        ...acc,
        ...optionPartMap,
        [option]: option,
      };
    }, {});
  }, [options]);

  const setFilter: SetFilterOptions = React.useCallback(
    (newFilterValue: string) => {
      if (!newFilterValue) {
        setFilteredOptions(options);
        return;
      }

      const newOptions: string[] = _.uniq(
        Object.keys(filterMappings.current)
          .filter((value: string) => value.toLowerCase().startsWith(newFilterValue.toLowerCase()))
          .map((value: string) => filterMappings.current[value]),
      );
      setFilteredOptions(newOptions);
    },
    [options],
  );

  return [filteredOptions, setFilter];
};

/**
 * Listens to the node in various ways to prefer functions of AutoComplete.
 */
const useNodeListener = (
  cursorPosition: React.MutableRefObject<CursorPosition>,
  menuOptions: MenuKeyWatcherHook,
  filterOptions: FilterOptionsHook,
  setFocusingOptions: (isFocusing: boolean) => void,
  closeCleanup: () => void,
): [React.MutableRefObject<ElementType>, (node: ElementType) => void] => {
  const [node, setNode] = React.useState<ElementType>(null);
  const nodeRef = React.useRef<ElementType>(null);
  nodeRef.current = node;

  const { isOpen, shouldOpen } = menuOptions;
  const [, setFilter] = filterOptions;

  const onKeyCallback = React.useCallback(
    (e) => {
      const applyFilterAtCursor = () => {
        const filterValue = nodeRef.current.value.substring(
          cursorPosition.current[0],
          cursorPosition.current[1],
        );
        setFilter(filterValue);
      };

      if (isOpen) {
        cursorPosition.current = [cursorPosition.current[0], nodeRef.current.selectionEnd];

        if (cursorPosition.current[1] < cursorPosition.current[0]) {
          // User moved before the start of the autoComplete trigger, close
          closeCleanup();
          return;
        }

        applyFilterAtCursor();
      } else {
        cursorPosition.current = [nodeRef.current.selectionStart, nodeRef.current.selectionEnd];
        const isOpening = shouldOpen(e);

        if (isOpening) {
          // In the case they are highlighting text, invoke auto complete immediately on the text
          applyFilterAtCursor();
        }
      }
    },
    [isOpen, setFilter, shouldOpen, closeCleanup, cursorPosition],
  );

  const focusDropdownCallback = React.useCallback(
    (e) => {
      if (!isOpen) return;

      if (e.code === 'Tab' || e.code === 'ArrowDown') {
        e.stopPropagation();
        e.preventDefault();
        setFocusingOptions(true);
      }
    },
    [isOpen, setFocusingOptions],
  );

  React.useEffect(() => {
    if (node) {
      node.addEventListener('keydown', focusDropdownCallback);
      node.addEventListener('keyup', onKeyCallback);
    }

    return () => {
      if (node) {
        node.removeEventListener('keydown', focusDropdownCallback);
        node.removeEventListener('keyup', onKeyCallback);
      }
    };
  }, [focusDropdownCallback, onKeyCallback, node]);

  return [nodeRef, (contentNode) => setNode(contentNode)];
};

/**
 * Manages auto complete state.
 */
const useAutoComplete = (
  autoCompleteValues: string[],
  onAutoComplete: SetAutoCompleteCallback,
): AutoCompleteHook => {
  const cursorPosition = React.useRef<CursorPosition>([0, 0]);
  const [focusingOptions, setFocusingOptions] = React.useState<boolean>(false);
  const menuOptions = useOpenMenuKeyWatcher();
  const filterOptions = useFilterOptions(autoCompleteValues);

  const { isOpen, closeMenu } = menuOptions;
  const [options, setFilter] = filterOptions;

  const closeCleanup = React.useCallback(() => {
    closeMenu();
    setFilter('');
    setFocusingOptions(false);
    cursorPosition.current = [0, 0];
  }, [closeMenu, setFilter]);

  const [nodeRef, setNodeRef] = useNodeListener(
    cursorPosition,
    menuOptions,
    filterOptions,
    setFocusingOptions,
    closeCleanup,
  );

  const insertAutoComplete = React.useCallback(
    (newValue: string) => {
      // Look for the PARAM_REFERENCE prefix to see if we need to add it
      const leftCapturePoint = cursorPosition.current[0] - PARAM_REFERENCE.length;
      const prefix =
        leftCapturePoint >= 0
          ? nodeRef.current.value.substr(leftCapturePoint, PARAM_REFERENCE.length)
          : null;
      const hasPrefix = prefix === PARAM_REFERENCE;

      // Update the value + the node
      const insertValue = `${hasPrefix ? '' : PARAM_REFERENCE}${newValue})`;
      onAutoComplete(insertIntoValue(nodeRef.current.value, cursorPosition.current, insertValue));

      // Make sure the cursor remains at the end of the inserted text so they can continue typing a prefix (if desired)
      const cursorEndPoint: number = cursorPosition.current[0] + insertValue.length;
      setTimeout(() => {
        nodeRef.current.setSelectionRange(cursorEndPoint, cursorEndPoint);
      }, 0);

      closeCleanup();
    },
    [nodeRef, closeCleanup, onAutoComplete],
  );

  return {
    contentRefCallback: setNodeRef,
    focusTrapProps: {
      active: focusingOptions,
      focusTrapOptions: {
        clickOutsideDeactivates: true,
        onDeactivate: closeCleanup,
        fallbackFocus: nodeRef.current,
      },
    },
    insertAutoComplete,
    menuWidth: nodeRef.current?.getBoundingClientRect().width || 300,
    options,
    popperProps: {
      open: isOpen,
      onRequestClose: closeCleanup,
      reference: () => nodeRef.current,
    },
  };
};

export default useAutoComplete;

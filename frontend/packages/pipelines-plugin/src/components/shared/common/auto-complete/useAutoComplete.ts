import * as React from 'react';
import * as _ from 'lodash';
import { CursorPosition, insertIntoValue } from './autoCompleteUtils';

type ElementType = HTMLInputElement | HTMLTextAreaElement;
type AutoCompleteHook = {
  contentRef: (contentNode: ElementType) => void;
  insertAutoComplete: (newValue: string) => void;
  options: string[];
  popperProps: {
    open: boolean;
    onRequestClose: () => void;
    reference: () => ElementType;
  };
};

type InsertAtCursor = (additionalValue: string) => void;

type MenuKeyWatcherHook = {
  isOpen: boolean;
  shouldOpen: (event, insertAtCursor: InsertAtCursor) => void;
  close: () => void;
};

type SetFilterOptions = (filterValue: string) => void;
type FilterOptionsHook = [string[], SetFilterOptions];

/**
 * Tracks open state + manages keystrokes to open.
 */
const useOpenMenuKeyWatcher = (): MenuKeyWatcherHook => {
  const [isOpen, setOpen] = React.useState<boolean>(false);
  const lastKey = React.useRef<string>('');

  const shouldOpen = React.useCallback(
    (event, insertAtCursor: InsertAtCursor) => {
      const { key, code, ctrlKey } = event;

      if (code === 'Space' && ctrlKey) {
        // Hotkey to open
        setOpen(true);
        insertAtCursor('$(');
        return;
      }

      if (!['$', '('].includes(key) || isOpen) {
        // Ignore event, does not apply to opening
        return;
      }

      if (lastKey.current === '$' && key === '(') {
        // Manual open
        setOpen(true);
      } else {
        // Not manual open, track the key for next loop
        lastKey.current = key;
      }
    },
    [isOpen],
  );

  return { isOpen, shouldOpen, close: React.useCallback(() => setOpen(false), []) };
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
          [`${optionPart}|${idx}`]: option,
        };
      }, {});

      return {
        ...acc,
        ...optionPartMap,
      };
    }, {});
  }, [options]);

  const setFilter: SetFilterOptions = (newFilterValue) => {
    const newOptions: string[] = _.uniq(
      Object.keys(filterMappings.current)
        .filter((value: string) => value.startsWith(newFilterValue))
        .map((value: string) => filterMappings.current[value]),
    );
    setFilteredOptions(newOptions);
  };

  return [filteredOptions, setFilter];
};

/**
 * Manages auto complete state.
 */
const useAutoComplete = (
  autoCompleteValues: string[],
  onAutoComplete: (newValue: string) => void,
): AutoCompleteHook => {
  const [node, setNode] = React.useState<ElementType>(null);
  const nodeRef = React.useRef<ElementType>(null);
  nodeRef.current = node;
  const cursorPosition = React.useRef<CursorPosition>([0, 0]);
  const { isOpen, shouldOpen, close } = useOpenMenuKeyWatcher();
  const [options, setFilter] = useFilterOptions(autoCompleteValues);

  const onKeyCallback = React.useCallback(
    (e) => {
      if (isOpen) {
        cursorPosition.current = [cursorPosition.current[0], nodeRef.current.selectionEnd];
        const filterValue = nodeRef.current.value.substr(...cursorPosition.current);
        setFilter(filterValue);
      } else {
        cursorPosition.current = [nodeRef.current.selectionStart, nodeRef.current.selectionEnd];
        shouldOpen(e, (additionalContent = '') => {
          onAutoComplete(
            insertIntoValue(nodeRef.current.value, cursorPosition.current, additionalContent),
          );
          // Align the start to be after any additional characters so we can track just new content
          const startPos = cursorPosition.current[0];
          const newStartPos = startPos + additionalContent.length;
          cursorPosition.current = [newStartPos, newStartPos];
        });
      }
    },
    [isOpen, setFilter, shouldOpen, onAutoComplete],
  );

  React.useEffect(() => {
    if (node) {
      node.addEventListener('keyup', onKeyCallback);
    }

    return () => {
      if (node) {
        node.removeEventListener('keyup', onKeyCallback);
      }
    };
  }, [onKeyCallback, node]);

  const insertAutoComplete = React.useCallback(
    (newValue: string) => {
      // Note: '$(' should already exist, add the value they selected and end the block with ')'
      const insertValue = `${newValue})`;

      onAutoComplete(insertIntoValue(nodeRef.current.value, cursorPosition.current, insertValue));
      close();
      setFilter('');
    },
    [close, onAutoComplete, setFilter],
  );

  return {
    contentRef: (contentNode) => setNode(contentNode),
    insertAutoComplete,
    options,
    popperProps: {
      open: isOpen,
      onRequestClose: close,
      reference: () => nodeRef.current,
    },
  };
};

export default useAutoComplete;

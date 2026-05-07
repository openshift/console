import { useState, useCallback, useMemo, useEffect } from 'react';

type UseDataViewSelectionOptions<T> = {
  /** All data items */
  data: T[];
  /** Function to extract unique ID from an item */
  getItemId: (item: T) => string;
  /** Optional filter to exclude certain items from selection (e.g., filter out CSRs) */
  filterSelectable?: (item: T) => boolean;
};

type UseDataViewSelectionResult<T> = {
  /** Set of selected item IDs */
  selectedIds: Set<string>;
  /** Array of selected item objects */
  selectedItems: T[];
  /** Callback to select/deselect a single item */
  onSelectItem: (itemId: string, isSelecting: boolean) => void;
  /** Callback to select/deselect all filtered items */
  onSelectAll: (isSelecting: boolean, filteredItems: T[]) => void;
  /** Clear all selections */
  clearSelection: () => void;
};

/**
 * Custom hook for managing selection state in DataView components.
 * Provides selection state, callbacks, and selected item objects.
 *
 * @example
 * ```typescript
 * const { selectedIds, selectedItems, onSelectItem, onSelectAll, clearSelection } =
 *   useDataViewSelection({
 *     data,
 *     getItemId: (node) => getUID(node),
 *     filterSelectable: (item) => !isCSRResource(item),
 *   });
 * ```
 */
export const useDataViewSelection = <T>({
  data,
  getItemId,
  filterSelectable,
}: UseDataViewSelectionOptions<T>): UseDataViewSelectionResult<T> => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Update selection to only include items that still exist in the current data
  useEffect(() => {
    const selectableData = filterSelectable ? data.filter(filterSelectable) : data;
    const currentValidIds = new Set(selectableData.map(getItemId));

    setSelectedIds((prev) => {
      const filtered = new Set<string>();
      prev.forEach((id) => {
        if (currentValidIds.has(id)) {
          filtered.add(id);
        }
      });
      // Only update if the selection actually changed
      return filtered.size === prev.size ? prev : filtered;
    });
  }, [data, getItemId, filterSelectable]);

  const onSelectItem = useCallback((itemId: string, isSelecting: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (isSelecting) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  }, []);

  const onSelectAll = useCallback(
    (isSelecting: boolean, filteredItems: T[]) => {
      if (isSelecting) {
        const selectableItems = filterSelectable
          ? filteredItems.filter(filterSelectable)
          : filteredItems;
        const itemIds = selectableItems.map(getItemId);
        setSelectedIds(new Set(itemIds));
      } else {
        setSelectedIds(new Set());
      }
    },
    [getItemId, filterSelectable],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedItems = useMemo(() => {
    const selectableData = filterSelectable ? data.filter(filterSelectable) : data;
    return selectableData.filter((item) => selectedIds.has(getItemId(item)));
  }, [data, selectedIds, getItemId, filterSelectable]);

  return {
    selectedIds,
    selectedItems,
    onSelectItem,
    onSelectAll,
    clearSelection,
  };
};

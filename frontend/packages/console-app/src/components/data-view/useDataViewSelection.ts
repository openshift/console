import { useState, useCallback, useEffect } from 'react';

/** Selection state used by ConsoleDataView. */
export const useDataViewSelection = <T>({
  data,
  getItemId,
  isSelectable,
}: {
  data: T[];
  getItemId?: (item: T) => string;
  isSelectable?: (item: T) => boolean;
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const validIds = new Set(
      getItemId ? data.filter((item) => !isSelectable || isSelectable(item)).map(getItemId) : [],
    );
    // Removed resources must not reappear selected if the same ID later returns.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => validIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [data, getItemId, isSelectable]);

  const onSelectItem = useCallback((itemId: string, isSelecting: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (isSelecting) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, []);

  const onSelectAll = useCallback(
    (isSelecting: boolean, items: T[]) => {
      if (!getItemId) return;
      setSelectedIds((current) => {
        const next = new Set(current);
        items.forEach((item) => {
          if (!isSelectable || isSelectable(item)) {
            const id = getItemId(item);
            if (isSelecting) {
              next.add(id);
            } else {
              next.delete(id);
            }
          }
        });
        return next;
      });
    },
    [getItemId, isSelectable],
  );

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const deselect = useCallback((itemIds: string[]) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      itemIds.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  return { selectedIds, onSelectItem, onSelectAll, clearSelection, deselect };
};

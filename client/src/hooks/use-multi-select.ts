import { useState, useCallback, useMemo } from "react";

interface UseMultiSelectOptions<T> {
  items: T[];
  getItemId: (item: T) => string | number;
}

export function useMultiSelect<T>({ items, getItemId }: UseMultiSelectOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Check if an item is selected
  const isSelected = useCallback(
    (item: T) => selectedIds.has(getItemId(item)),
    [selectedIds, getItemId]
  );

  // Toggle selection of a single item
  const toggleSelection = useCallback(
    (item: T) => {
      const id = getItemId(item);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [getItemId]
  );

  // Select multiple items
  const selectItems = useCallback(
    (itemsToSelect: T[]) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        itemsToSelect.forEach((item) => {
          next.add(getItemId(item));
        });
        return next;
      });
    },
    [getItemId]
  );

  // Deselect multiple items
  const deselectItems = useCallback(
    (itemsToDeselect: T[]) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        itemsToDeselect.forEach((item) => {
          next.delete(getItemId(item));
        });
        return next;
      });
    },
    [getItemId]
  );

  // Select all items
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(getItemId)));
  }, [items, getItemId]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Toggle all items
  const toggleAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [selectedIds.size, items.length, clearSelection, selectAll]);

  // Select items by predicate
  const selectByPredicate = useCallback(
    (predicate: (item: T) => boolean) => {
      const itemsToSelect = items.filter(predicate);
      selectItems(itemsToSelect);
    },
    [items, selectItems]
  );

  // Invert selection
  const invertSelection = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set<string | number>();
      items.forEach((item) => {
        const id = getItemId(item);
        if (!prev.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [items, getItemId]);

  // Range selection (for shift+click)
  const selectRange = useCallback(
    (startItem: T, endItem: T) => {
      const startIndex = items.findIndex((item) => getItemId(item) === getItemId(startItem));
      const endIndex = items.findIndex((item) => getItemId(item) === getItemId(endItem));
      
      if (startIndex === -1 || endIndex === -1) return;
      
      const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
      const rangeItems = items.slice(from, to + 1);
      selectItems(rangeItems);
    },
    [items, getItemId, selectItems]
  );

  // Get selected items
  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  // Check if all items are selected
  const isAllSelected = useMemo(() => {
    return items.length > 0 && selectedIds.size === items.length;
  }, [items.length, selectedIds.size]);

  // Check if some items are selected (for indeterminate state)
  const isSomeSelected = useMemo(() => {
    return selectedIds.size > 0 && selectedIds.size < items.length;
  }, [selectedIds.size, items.length]);

  return {
    selectedIds,
    selectedItems,
    isSelected,
    toggleSelection,
    selectItems,
    deselectItems,
    selectAll,
    clearSelection,
    toggleAll,
    selectByPredicate,
    invertSelection,
    selectRange,
    isAllSelected,
    isSomeSelected,
    selectedCount: selectedIds.size,
  };
}
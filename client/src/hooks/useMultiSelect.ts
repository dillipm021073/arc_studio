import { useState, useCallback, useMemo } from 'react';

export interface UseMultiSelectOptions<T> {
  idKey?: keyof T;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export function useMultiSelect<T extends Record<string, any>>(
  items: T[],
  options: UseMultiSelectOptions<T> = {}
) {
  const { idKey = 'id' as keyof T, onSelectionChange } = options;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const itemIds = useMemo(
    () => items.map(item => String(item[idKey])),
    [items, idKey]
  );

  const isSelected = useCallback(
    (id: string) => selectedIds.has(String(id)),
    [selectedIds]
  );

  const selectAll = useCallback(() => {
    const newSelection = new Set(itemIds);
    setSelectedIds(newSelection);
    onSelectionChange?.(newSelection);
  }, [itemIds, onSelectionChange]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    onSelectionChange?.(new Set());
  }, [onSelectionChange]);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === itemIds.length) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [selectedIds.size, itemIds.length, selectAll, deselectAll]);

  const toggleSelection = useCallback(
    (id: string, event?: React.MouseEvent) => {
      const strId = String(id);
      const newSelection = new Set(selectedIds);

      if (event?.shiftKey && lastSelectedId) {
        // Range selection
        const currentIndex = itemIds.indexOf(strId);
        const lastIndex = itemIds.indexOf(lastSelectedId);
        
        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex);
          const end = Math.max(currentIndex, lastIndex);
          
          for (let i = start; i <= end; i++) {
            newSelection.add(itemIds[i]);
          }
        }
      } else if (event?.ctrlKey || event?.metaKey) {
        // Toggle individual selection
        if (newSelection.has(strId)) {
          newSelection.delete(strId);
        } else {
          newSelection.add(strId);
        }
      } else {
        // Single selection (clear others)
        newSelection.clear();
        newSelection.add(strId);
      }

      setSelectedIds(newSelection);
      setLastSelectedId(strId);
      onSelectionChange?.(newSelection);
    },
    [selectedIds, lastSelectedId, itemIds, onSelectionChange]
  );

  const selectByPredicate = useCallback(
    (predicate: (item: T) => boolean) => {
      const newSelection = new Set(selectedIds);
      items.forEach(item => {
        if (predicate(item)) {
          newSelection.add(String(item[idKey]));
        }
      });
      setSelectedIds(newSelection);
      onSelectionChange?.(newSelection);
    },
    [items, idKey, selectedIds, onSelectionChange]
  );

  const selectedItems = useMemo(
    () => items.filter(item => isSelected(String(item[idKey]))),
    [items, idKey, isSelected]
  );

  const isAllSelected = useMemo(
    () => itemIds.length > 0 && selectedIds.size === itemIds.length,
    [itemIds.length, selectedIds.size]
  );

  const isPartiallySelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < itemIds.length,
    [selectedIds.size, itemIds.length]
  );

  return {
    selectedIds,
    selectedItems,
    isSelected,
    isAllSelected,
    isPartiallySelected,
    toggleSelection,
    toggleAll,
    selectAll,
    deselectAll,
    selectByPredicate,
    selectionCount: selectedIds.size,
  };
}
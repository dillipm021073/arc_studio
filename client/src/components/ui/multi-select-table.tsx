import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface MultiSelectTableProps<T> {
  items: T[];
  selectedIds: Set<string | number>;
  getItemId: (item: T) => string | number;
  onToggleSelection: (item: T, event?: React.MouseEvent) => void;
  onToggleAll: () => void;
  onRangeSelect?: (startItem: T, endItem: T) => void;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onRowDoubleClick?: (item: T) => void;
  onRowContextMenu?: (item: T, event: React.MouseEvent) => void;
  headers: React.ReactNode;
  children: (item: T) => React.ReactNode;
  renderContextMenu?: (item: T, rowContent: React.ReactNode) => React.ReactNode;
  getRowClassName?: (item: T, isSelected: boolean) => string;
  className?: string;
}

export function MultiSelectTable<T>({
  items,
  selectedIds,
  getItemId,
  onToggleSelection,
  onToggleAll,
  onRangeSelect,
  isAllSelected,
  isSomeSelected,
  onRowDoubleClick,
  onRowContextMenu,
  headers,
  children,
  renderContextMenu,
  getRowClassName,
  className,
}: MultiSelectTableProps<T>) {
  let lastClickedIndex = -1;

  const handleRowClick = (item: T, index: number, event: React.MouseEvent) => {
    // Don't toggle selection if clicking on the checkbox itself
    if ((event.target as HTMLElement).closest('button[role="checkbox"]')) {
      return;
    }
    
    if (event.shiftKey && onRangeSelect && lastClickedIndex !== -1) {
      const startIndex = Math.min(lastClickedIndex, index);
      const endIndex = Math.max(lastClickedIndex, index);
      onRangeSelect(items[startIndex], items[endIndex]);
    } else {
      onToggleSelection(item, event);
      lastClickedIndex = index;
    }
  };

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={isAllSelected}
              indeterminate={isSomeSelected}
              onCheckedChange={onToggleAll}
              aria-label="Select all"
            />
          </TableHead>
          {headers}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => {
          const id = getItemId(item);
          const isSelected = selectedIds.has(id);
          
          const rowContent = (
            <TableRow
              key={String(id)}
              className={cn(
                'cursor-pointer',
                getRowClassName ? getRowClassName(item, isSelected) : cn(isSelected && 'bg-accent'),
              )}
              onClick={(e) => handleRowClick(item, index, e)}
              onDoubleClick={() => onRowDoubleClick?.(item)}
              onContextMenu={(e) => onRowContextMenu?.(item, e)}
            >
              <TableCell className="w-12">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelection(item)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select row ${id}`}
                />
              </TableCell>
              {children(item)}
            </TableRow>
          );

          return renderContextMenu ? renderContextMenu(item, rowContent) : rowContent;
        })}
      </TableBody>
    </Table>
  );
}

export { TableBody, TableCell, TableHead };
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Edit, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onClear?: () => void;
  onBulkEdit?: () => void;
  onBulkDelete?: () => void;
  onClearSelection?: () => void;
  onSelectAll?: () => void;
  onInvertSelection?: () => void;
  className?: string;
  editLabel?: string;
  deleteLabel?: string;
  duplicateLabel?: string;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  onEdit,
  onDelete,
  onDuplicate,
  onClear,
  onBulkEdit,
  onBulkDelete,
  onClearSelection,
  onSelectAll,
  onInvertSelection,
  className,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  duplicateLabel = 'Duplicate',
}: BulkActionBarProps) {
  // Support both naming conventions
  const handleEdit = onEdit || onBulkEdit;
  const handleDelete = onDelete || onBulkDelete;
  const handleClear = onClear || onClearSelection;
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between bg-accent/50 border rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-200',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <div className="flex items-center gap-2">
          {handleEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              {editLabel}
            </Button>
          )}
          {onDuplicate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              {duplicateLabel}
            </Button>
          )}
          {handleDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              {deleteLabel}
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onSelectAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="gap-2"
          >
            Select All
          </Button>
        )}
        {onInvertSelection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onInvertSelection}
            className="gap-2"
          >
            Invert
          </Button>
        )}
        {handleClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
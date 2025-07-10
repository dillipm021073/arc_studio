import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Plus } from "lucide-react";

export type FilterOperator = 
  | "equals" 
  | "not_equals" 
  | "contains" 
  | "not_contains" 
  | "starts_with" 
  | "ends_with" 
  | "greater_than" 
  | "less_than" 
  | "greater_equal" 
  | "less_equal";

export interface FilterCondition {
  column: string;
  operator: FilterOperator;
  value: string;
}

export interface FilterColumn {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select";
  options?: { value: string; label: string }[];
}

interface DataFilterProps {
  columns: FilterColumn[];
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  onClearAllFilters?: () => void;
}

const operatorLabels: Record<FilterOperator, string> = {
  equals: "=",
  not_equals: "≠",
  contains: "contains",
  not_contains: "doesn't contain",
  starts_with: "starts with",
  ends_with: "ends with",
  greater_than: ">",
  less_than: "<",
  greater_equal: "≥",
  less_equal: "≤",
};

const getOperatorsForType = (type?: string): FilterOperator[] => {
  switch (type) {
    case "number":
    case "date":
      return ["equals", "not_equals", "greater_than", "less_than", "greater_equal", "less_equal"];
    case "select":
      return ["equals", "not_equals"];
    default:
      return ["equals", "not_equals", "contains", "not_contains", "starts_with", "ends_with"];
  }
};

export function DataFilter({ columns, filters, onFiltersChange, onClearAllFilters }: DataFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<Partial<FilterCondition>>({
    column: columns[0]?.key || "",
    operator: "contains",
    value: "",
  });

  const addFilter = () => {
    if (currentFilter.column && currentFilter.operator && currentFilter.value) {
      onFiltersChange([...filters, currentFilter as FilterCondition]);
      setCurrentFilter({
        column: columns[0]?.key || "",
        operator: "contains",
        value: "",
      });
    }
  };

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
    onClearAllFilters?.();
  };

  const selectedColumn = columns.find(col => col.key === currentFilter.column);
  const availableOperators = getOperatorsForType(selectedColumn?.type);

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
            {filters.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-4" align="start">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-3">Add Filter</h4>
              <div className="space-y-2">
                <Select
                  value={currentFilter.column}
                  onValueChange={(value) => {
                    const column = columns.find(col => col.key === value);
                    setCurrentFilter({
                      ...currentFilter,
                      column: value,
                      operator: getOperatorsForType(column?.type)[0],
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column) => (
                      <SelectItem key={column.key} value={column.key}>
                        {column.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={currentFilter.operator}
                  onValueChange={(value) =>
                    setCurrentFilter({ ...currentFilter, operator: value as FilterOperator })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOperators.map((op) => (
                      <SelectItem key={op} value={op}>
                        {operatorLabels[op]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedColumn?.type === "select" && selectedColumn.options ? (
                  <Select
                    value={currentFilter.value}
                    onValueChange={(value) =>
                      setCurrentFilter({ ...currentFilter, value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedColumn.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={selectedColumn?.type === "number" ? "number" : "text"}
                    placeholder="Enter value"
                    value={currentFilter.value}
                    onChange={(e) =>
                      setCurrentFilter({ ...currentFilter, value: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addFilter();
                      }
                    }}
                  />
                )}

                <Button
                  onClick={addFilter}
                  disabled={!currentFilter.column || !currentFilter.operator || !currentFilter.value}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Filter
                </Button>
              </div>
            </div>

            {filters.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Active Filters</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-auto p-1 text-xs"
                  >
                    Clear all
                  </Button>
                </div>
                <div className="space-y-1">
                  {filters.map((filter, index) => {
                    const column = columns.find(col => col.key === filter.column);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm"
                      >
                        <span>
                          <span className="font-medium">{column?.label}</span>{" "}
                          <span className="text-gray-500">{operatorLabels[filter.operator]}</span>{" "}
                          <span className="font-medium">
                            {column?.type === "select" && column.options
                              ? column.options.find(opt => opt.value === filter.value)?.label || filter.value
                              : filter.value}
                          </span>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(index)}
                          className="h-auto p-1"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {filters.length > 0 && (
        <div className="flex items-center gap-1">
          {filters.map((filter, index) => {
            const column = columns.find(col => col.key === filter.column);
            return (
              <Badge key={index} variant="secondary" className="gap-1">
                {column?.label} {operatorLabels[filter.operator]}{" "}
                {column?.type === "select" && column.options
                  ? column.options.find(opt => opt.value === filter.value)?.label || filter.value
                  : filter.value}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(index)}
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 px-2 text-xs"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper function to apply filters
export function applyFilters<T extends Record<string, any>>(
  data: T[],
  filters: FilterCondition[]
): T[] {
  if (filters.length === 0) return data;

  return data.filter((item) => {
    return filters.every((filter) => {
      const value = item[filter.column];
      const filterValue = filter.value;

      if (value === null || value === undefined) return false;

      const stringValue = String(value).toLowerCase();
      const stringFilterValue = filterValue.toLowerCase();

      switch (filter.operator) {
        case "equals":
          return stringValue === stringFilterValue;
        case "not_equals":
          return stringValue !== stringFilterValue;
        case "contains":
          return stringValue.includes(stringFilterValue);
        case "not_contains":
          return !stringValue.includes(stringFilterValue);
        case "starts_with":
          return stringValue.startsWith(stringFilterValue);
        case "ends_with":
          return stringValue.endsWith(stringFilterValue);
        case "greater_than":
          return Number(value) > Number(filterValue);
        case "less_than":
          return Number(value) < Number(filterValue);
        case "greater_equal":
          return Number(value) >= Number(filterValue);
        case "less_equal":
          return Number(value) <= Number(filterValue);
        default:
          return true;
      }
    });
  });
}
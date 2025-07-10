import { useState, useEffect } from 'react';
import { FilterCondition } from '@/components/ui/data-filter';

interface PersistentFilterState {
  searchTerm: string;
  filters: FilterCondition[];
}

export function usePersistentFilters(pageKey: string) {
  const storageKey = `filters_${pageKey}`;
  
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<PersistentFilterState>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          searchTerm: parsed.searchTerm || '',
          filters: parsed.filters || []
        };
      }
    } catch (error) {
      console.warn(`Failed to load filters for ${pageKey}:`, error);
    }
    
    return {
      searchTerm: '',
      filters: []
    };
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to save filters for ${pageKey}:`, error);
    }
  }, [state, storageKey, pageKey]);

  const updateSearchTerm = (searchTerm: string) => {
    setState(prev => ({ ...prev, searchTerm }));
  };

  const updateFilters = (filters: FilterCondition[]) => {
    setState(prev => ({ ...prev, filters }));
  };

  const clearAllFilters = () => {
    setState({ searchTerm: '', filters: [] });
  };

  const hasActiveFilters = () => {
    return state.searchTerm.length > 0 || state.filters.length > 0;
  };

  return {
    searchTerm: state.searchTerm,
    filters: state.filters,
    updateSearchTerm,
    updateFilters,
    clearAllFilters,
    hasActiveFilters
  };
}
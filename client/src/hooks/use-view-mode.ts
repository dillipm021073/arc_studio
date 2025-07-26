import { useState, useEffect } from 'react';

export type ViewMode = 'table' | 'explorer' | 'card' | 'list' | 'tree' | 'hierarchy';

interface ViewModeState {
  viewMode: ViewMode;
}

export function useViewMode(pageKey: string, defaultMode: ViewMode = 'table', availableModes?: ViewMode[]) {
  const storageKey = `viewMode_${pageKey}`;
  
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<ViewModeState>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate that the stored mode is available
        if (availableModes && !availableModes.includes(parsed.viewMode)) {
          return { viewMode: defaultMode };
        }
        return {
          viewMode: parsed.viewMode || defaultMode
        };
      }
    } catch (error) {
      console.warn(`Failed to load view mode for ${pageKey}:`, error);
    }
    
    return {
      viewMode: defaultMode
    };
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to save view mode for ${pageKey}:`, error);
    }
  }, [state, storageKey, pageKey]);

  const setViewMode = (viewMode: ViewMode) => {
    // Validate mode if available modes are specified
    if (availableModes && !availableModes.includes(viewMode)) {
      console.warn(`Invalid view mode "${viewMode}" for ${pageKey}. Available modes:`, availableModes);
      return;
    }
    setState({ viewMode });
  };

  return {
    viewMode: state.viewMode,
    setViewMode
  };
}

// Hook for pages that support table/explorer modes
export function useTableExplorerMode(pageKey: string, defaultMode: 'table' | 'explorer' = 'table') {
  return useViewMode(pageKey, defaultMode, ['table', 'explorer']);
}

// Hook for artifact pages that support multiple view modes
export function useArtifactViewMode(pageKey: string, availableModes: ViewMode[], defaultMode: ViewMode = 'table') {
  return useViewMode(pageKey, defaultMode, availableModes);
}
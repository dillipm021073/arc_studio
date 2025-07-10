import { useState, useCallback, useRef } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndoRedo<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Track if we're in the middle of an undo/redo operation
  const isUndoRedoRef = useRef(false);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const pushState = useCallback((newState: T) => {
    // Don't push state if we're in the middle of undo/redo
    if (isUndoRedoRef.current) {
      return;
    }

    setHistory((prev) => ({
      past: [...prev.past, prev.present],
      present: newState,
      future: [], // Clear future when new state is pushed
    }));
  }, []);

  const undo = useCallback(() => {
    if (!canUndo) return;

    isUndoRedoRef.current = true;
    
    setHistory((prev) => {
      const newPast = [...prev.past];
      const newPresent = newPast.pop()!;
      
      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      };
    });

    // Reset the flag after a short delay to ensure state updates have propagated
    setTimeout(() => {
      isUndoRedoRef.current = false;
    }, 0);
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    isUndoRedoRef.current = true;
    
    setHistory((prev) => {
      const newFuture = [...prev.future];
      const newPresent = newFuture.shift()!;
      
      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture,
      };
    });

    // Reset the flag after a short delay
    setTimeout(() => {
      isUndoRedoRef.current = false;
    }, 0);
  }, [canRedo]);

  const reset = useCallback((newState: T) => {
    setHistory({
      past: [],
      present: newState,
      future: [],
    });
  }, []);

  return {
    state: history.present,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    isUndoRedo: isUndoRedoRef.current,
  };
}
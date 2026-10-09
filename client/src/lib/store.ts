"use client";

import { useState, useEffect, useCallback } from 'react';

const STORE_KEY = 'antigravity_hackathon_state';

export type Order = {
  id: string;
  recipe: string;
  price: number;
  status: 'pending' | 'assigned' | 'picking' | 'delivering' | 'completed';
  substituted: boolean;
  subText?: string;
  timestamp: number;
};

export type AppState = {
  inventory: {
    heavy_cream: number;
    cilantro: number;
  };
  orders: Order[];
  riderOnline: boolean;
};

const defaultState: AppState = {
  inventory: {
    heavy_cream: 1, // Start with 1 so the first order uses it, next order triggers sub
    cilantro: 12,
  },
  orders: [],
  riderOnline: true,
};

// Global memory for the same tab to avoid multiple instances desyncing
let memoryState = defaultState;
const listeners = new Set<(state: AppState) => void>();

export function useAppStore() {
  const [state, setState] = useState<AppState>(defaultState);

  useEffect(() => {
    // Initial load
    const stored = localStorage.getItem(STORE_KEY);
    if (stored) {
      memoryState = JSON.parse(stored);
      setState(memoryState);
    } else {
      localStorage.setItem(STORE_KEY, JSON.stringify(defaultState));
      memoryState = defaultState;
    }

    const listener = (newState: AppState) => setState(newState);
    listeners.add(listener);

    // Cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORE_KEY && e.newValue) {
        const next = JSON.parse(e.newValue);
        memoryState = next;
        listeners.forEach(l => l(next));
      }
    };
    window.addEventListener('storage', handleStorage);
    
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    const next = updater(memoryState);
    memoryState = next;
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    listeners.forEach(l => l(next)); // notify same tab
  }, []);

  return { state, updateState };
}

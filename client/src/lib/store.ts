"use client";
import { useState, useEffect, useCallback } from 'react';

const STORE_KEY = 'antigravity_hackathon_state_v3';

export type OrderItem = {
  ingredientId: string;
  name: string;
  qty: number;
  substituted: boolean;
  subName?: string;
};

export type Order = {
  id: string;
  recipe: string;
  portions: number;
  price: number;
  status: 'pending' | 'assigned' | 'picking' | 'delivering' | 'completed';
  items: OrderItem[];
  timestamp: number;
};

export type InventoryItem = {
  name: string;
  stock: number;
  sub?: string;
};

export type AppState = {
  inventory: Record<string, InventoryItem>;
  orders: Order[];
  riderOnline: boolean;
};

export const defaultState: AppState = {
  inventory: {
    chicken: { name: 'Chicken Breast', stock: 12 },
    heavy_cream: { name: 'Heavy Cream', stock: 1, sub: 'Greek Yogurt' },
    tomatoes: { name: 'Roma Tomatoes', stock: 8, sub: 'Canned Tomatoes' },
    avocado: { name: 'Fresh Avocado', stock: 5, sub: 'Edamame' },
    quinoa: { name: 'Organic Quinoa', stock: 20 },
    basil: { name: 'Fresh Basil', stock: 0, sub: 'Dried Oregano' },
    pizza_dough: { name: 'Sourdough Base', stock: 10 },
    mango: { name: 'Alphonso Mango', stock: 2, sub: 'Frozen Peaches' },
    milk: { name: 'Oat Milk', stock: 15 },
  },
  orders: [],
  riderOnline: true,
};

let memoryState = defaultState;
const listeners = new Set<(state: AppState) => void>();

export function useAppStore() {
  const [state, setState] = useState<AppState>(defaultState);

  useEffect(() => {
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
    listeners.forEach(l => l(next)); 
  }, []);

  return { state, updateState };
}

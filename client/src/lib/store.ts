"use client";
import { useState, useEffect, useCallback } from "react";

const STORE_KEY = "antigravity_hackathon_state_v4";

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
  status:
    | "cart"
    | "pending"
    | "assigned"
    | "picking"
    | "delivering"
    | "completed";
  items: OrderItem[];
  timestamp: number;
  phaseStartTime?: number;
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
  auth: {
    customer: boolean;
    admin: boolean;
    rider: boolean;
  };
};

export const defaultState: AppState = {
  inventory: {
    chicken: { name: "Chicken Breast", stock: 12 },
    heavy_cream: { name: "Heavy Cream", stock: 1, sub: "Greek Yogurt" },
    tomatoes: { name: "Roma Tomatoes", stock: 8, sub: "Canned Tomatoes" },
    avocado: { name: "Fresh Avocado", stock: 5, sub: "Edamame" },
    quinoa: { name: "Organic Quinoa", stock: 20 },
    basil: { name: "Fresh Basil", stock: 0, sub: "Dried Oregano" },
    pizza_dough: { name: "Sourdough Base", stock: 10 },
    mango: { name: "Alphonso Mango", stock: 2, sub: "Frozen Peaches" },
    milk: { name: "Oat Milk", stock: 15 },
    mushrooms: { name: "Wild Mushrooms", stock: 4, sub: "Portobello" },
    pasta: { name: "Fettuccine", stock: 25 },
    beef_patty: {
      name: "Wagyu Beef Patty",
      stock: 0,
      sub: "Plant-based Patty",
    },
    buns: { name: "Brioche Buns", stock: 6, sub: "Gluten-Free Buns" },
    tofu: { name: "Firm Tofu", stock: 10 },
    rice: { name: "Jasmine Rice", stock: 50 },
    acai: { name: "Açaí Pack", stock: 1, sub: "Mixed Berries" },
    granola: { name: "Almond Granola", stock: 8 },
    // New ingredients for the 50 recipes
    paneer: { name: "Paneer Block", stock: 15 },
    lamb: { name: "Lamb Chops", stock: 5, sub: "Beef" },
    noodles: { name: "Egg Noodles", stock: 30 },
    soy_sauce: { name: "Soy Sauce", stock: 50 },
    cheese: { name: "Mozzarella", stock: 20 },
    potatoes: { name: "Russet Potatoes", stock: 40 },
    lettuce: { name: "Iceberg Lettuce", stock: 15 },
    salmon: { name: "Salmon Fillet", stock: 8, sub: "White Fish" },
    broccoli: { name: "Broccoli Crown", stock: 12 },
    eggs: { name: "Free Range Eggs", stock: 60 },
    spinach: { name: "Fresh Spinach", stock: 10, sub: "Kale" },
    lentils: { name: "Yellow Lentils", stock: 25 },
    garlic: { name: "Garlic Bulbs", stock: 100 },
  },
  orders: [],
  riderOnline: true,
  auth: {
    customer: false,
    admin: false,
    rider: false,
  },
};

let memoryState = defaultState;
const listeners = new Set<(state: AppState) => void>();

let lastLocalUpdate = 0;

export function useAppStore() {
  const [state, setState] = useState<AppState>(defaultState);

  useEffect(() => {
    const stored = localStorage.getItem(STORE_KEY);
    if (stored) {
      let parsed: any = {};
      try {
        parsed = JSON.parse(stored) || {};
      } catch (e) {
        console.warn("Failed to parse state from localStorage", e);
      }
      memoryState = {
        ...defaultState,
        ...parsed,
        inventory: { ...defaultState.inventory, ...(parsed.inventory || {}) },
        auth: { ...defaultState.auth, ...(parsed.auth || {}) },
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      };
      setState(memoryState);
    } else {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(defaultState));
      } catch (e) {}
      memoryState = defaultState;
    }

    const listener = (newState: AppState) => setState(newState);
    listeners.add(listener);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORE_KEY && e.newValue) {
        const next = JSON.parse(e.newValue);
        memoryState = next;
        listeners.forEach((l) => l(next));
      }
    };
    window.addEventListener("storage", handleStorage);

    // Cloud sync polling
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/state");
        const json = await res.json();
        if (json?.data) {
          const cloudUpdated = json.data.lastUpdated || 0;

          // Ignore cloud state if we've made a local update very recently (prevents overwriting local cart before PUT finishes)
          if (cloudUpdated < lastLocalUpdate) {
            return;
          }

          const cloudOrders = json.data.orders || [];
          const cloudInventory = json.data.inventory || memoryState.inventory;
          const cloudRider =
            json.data.riderOnline !== undefined
              ? json.data.riderOnline
              : memoryState.riderOnline;

          if (
            JSON.stringify(cloudOrders) !== JSON.stringify(memoryState.orders) ||
            JSON.stringify(cloudInventory) !==
              JSON.stringify(memoryState.inventory) ||
            cloudRider !== memoryState.riderOnline
          ) {
            const merged: AppState = {
              ...memoryState,
              orders: cloudOrders,
              inventory: cloudInventory,
              riderOnline: cloudRider,
            };
            memoryState = merged;
            listeners.forEach((l) => l(merged));
            try {
              localStorage.setItem(STORE_KEY, JSON.stringify(merged));
            } catch (e) {}
          }
        }
      } catch (e) {
        // fail silently for polling
      }
    }, 2000);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    const next = updater(memoryState);
    memoryState = next;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn("localStorage setItem failed", e);
    }
    listeners.forEach((l) => l(next));

    lastLocalUpdate = Date.now();

    // Push updates to cloud API, excluding auth
    const cloudPayload = {
      orders: next.orders,
      inventory: next.inventory,
      riderOnline: next.riderOnline,
      lastUpdated: lastLocalUpdate,
    };

    fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: cloudPayload }),
    }).catch(() => {});
  }, []);

  return { state, updateState };
}

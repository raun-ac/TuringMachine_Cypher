"use client";
import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export default function CustomerApp() {
  const { state, updateState } = useAppStore();
  const [justOrdered, setJustOrdered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleOrder = () => {
    const isOutOfStock = state.inventory.heavy_cream <= 0;
    
    const newOrder = {
      id: `ORD-${Math.floor(Math.random() * 1000) + 1000}`,
      recipe: 'Butter Chicken',
      price: 24.50,
      status: 'pending' as const,
      substituted: isOutOfStock,
      subText: isOutOfStock ? 'Yogurt (for Heavy Cream)' : undefined,
      timestamp: Date.now(),
    };

    updateState(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        heavy_cream: Math.max(0, prev.inventory.heavy_cream - 1)
      },
      orders: [newOrder, ...prev.orders]
    }));

    setJustOrdered(true);
    setTimeout(() => setJustOrdered(false), 4000);
  };

  if (!mounted) return null;

  const isSubNeeded = state.inventory.heavy_cream <= 0;

  return (
    <main className="min-h-screen bg-[#E5D9F2] text-black p-6 md:p-8 flex flex-col relative overflow-hidden">
      <nav className="flex justify-between items-center mb-16">
        <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center font-medium">
          <span className="text-xs">☰</span>
        </div>
        <button className="text-3xl font-light">⌄</button>
      </nav>

      {justOrdered && (
        <div className="fixed top-20 left-4 right-4 bg-black text-white p-6 rounded-2xl z-50 shadow-2xl animate-bounce">
          <h4 className="text-2xl font-medium mb-1">Order Placed!</h4>
          {isSubNeeded && (
            <p className="text-amber-300 font-medium text-sm">
              Note: Heavy cream was out of stock. We auto-substituted with Greek Yogurt for you!
            </p>
          )}
        </div>
      )}

      <div className="flex-1 max-w-md mx-auto w-full">
        <h1 className="text-7xl font-medium leading-[0.95] tracking-[-0.05em] mb-16">
          What are<br/>you cooking<br/>today?
        </h1>
        
        {/* Abstract stacked blocks imitating the bar chart vibe from the reference */}
        <div className="flex flex-col items-center gap-1 mb-16 h-48 justify-end">
           <div className="w-16 h-8 bg-black/80 flex items-center justify-center text-white text-xs font-medium">{state.orders.length}</div>
           <div className="w-16 h-12 bg-black/60"></div>
           <div className="w-16 h-16 bg-black/40"></div>
           <div className="w-16 h-8 bg-black/20"></div>
        </div>

        <div className="space-y-0 mb-24">
          <div className="group cursor-pointer">
            <div className="py-6 divider-top flex justify-between items-start">
              <div>
                <h3 className="text-4xl font-medium tracking-tight mb-2">Butter Chicken</h3>
                <p className="text-black/60 font-medium text-sm flex items-center gap-2">
                  <span className="w-2 h-2 border border-black block"></span>
                  12 items • 45 mins
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-medium block">+24.50</span>
              </div>
            </div>
            {/* Expanded state / action area */}
            <div className="pb-6">
              <button 
                onClick={handleOrder}
                className="w-full bg-black text-[#E5D9F2] py-4 rounded-full text-lg font-medium hover:bg-black/80 transition-colors active:scale-95 transform duration-100"
              >
                One-Tap Add to Cart
              </button>
              {isSubNeeded && (
                 <p className="mt-3 text-xs text-center font-bold text-red-600 uppercase tracking-widest">
                   Auto-Sub Active: Yogurt
                 </p>
              )}
            </div>
          </div>

          <div className="group cursor-pointer opacity-50">
            <div className="py-6 divider-top divider flex justify-between items-start">
              <div>
                <h3 className="text-4xl font-medium tracking-tight mb-2">Avocado Bowl</h3>
                <p className="text-black/60 font-medium text-sm flex items-center gap-2">
                  <span className="w-2 h-2 border border-black block"></span>
                  8 items • 15 mins
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-medium block">+18.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:hidden">
        <div className="home-indicator-circle"></div>
      </div>
    </main>
  );
}

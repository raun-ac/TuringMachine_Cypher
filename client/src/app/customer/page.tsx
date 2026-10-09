"use client";
import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

const RECIPES = [
  { id: 'butter-chicken', name: 'Butter Chicken', price: 24.50, items: 12, time: 45, requires: 'heavy_cream', emoji: '🍛' },
  { id: 'avocado-bowl', name: 'Avocado Bowl', price: 18.00, items: 8, time: 15, requires: 'avocado', emoji: '🥗' },
  { id: 'margherita', name: 'Margherita Pizza', price: 21.00, items: 5, time: 25, requires: 'basil', emoji: '🍕' },
  { id: 'mango-smoothie', name: 'Mango Smoothie', price: 9.50, items: 4, time: 5, requires: 'mango', emoji: '🥭' },
];

export default function CustomerApp() {
  const { state, updateState } = useAppStore();
  const [justOrdered, setJustOrdered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleOrder = (recipe: typeof RECIPES[0]) => {
    const requiredItem = state.inventory[recipe.requires];
    const isOutOfStock = requiredItem.stock <= 0;
    
    const newOrder = {
      id: `ORD-${Math.floor(Math.random() * 1000) + 1000}`,
      recipe: recipe.name,
      price: recipe.price,
      status: 'pending' as const,
      substituted: isOutOfStock,
      subText: isOutOfStock ? `${requiredItem.sub} (for ${requiredItem.name})` : undefined,
      timestamp: Date.now(),
    };

    updateState(prev => {
      const newInventory = { ...prev.inventory };
      if (newInventory[recipe.requires].stock > 0) {
        newInventory[recipe.requires].stock -= 1;
      }
      return {
        ...prev,
        inventory: newInventory,
        orders: [newOrder, ...prev.orders]
      };
    });

    setJustOrdered(recipe.id);
    setTimeout(() => setJustOrdered(null), 4000);
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#E5D9F2] text-black p-6 md:p-12 flex flex-col relative overflow-hidden">
      <nav className="flex justify-between items-center mb-12 animate-reveal">
        <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold tracking-tighter text-xl">
          JD
        </div>
        <div className="bg-black/5 px-4 py-2 rounded-full font-medium text-sm">
          {state.orders.length} Past Orders
        </div>
      </nav>

      <div className="flex-1 max-w-md mx-auto w-full pb-32">
        <h1 className="text-7xl font-medium leading-[0.95] tracking-[-0.05em] mb-16 animate-reveal delay-100">
          What are<br/>you cooking<br/>today?
        </h1>
        
        <div className="space-y-2">
          {RECIPES.map((recipe, index) => {
            const requiredItem = state.inventory[recipe.requires];
            const isSubNeeded = requiredItem.stock <= 0;
            const isJustOrdered = justOrdered === recipe.id;

            return (
              <div 
                key={recipe.id} 
                className={`group animate-reveal`} 
                style={{ animationDelay: `${(index + 2) * 0.1}s` }}
              >
                <div className={`p-6 rounded-3xl transition-all duration-500 hover:bg-white/40 ${isJustOrdered ? 'bg-black text-[#E5D9F2] scale-[1.02]' : 'bg-transparent'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4 items-start">
                      <span className="text-5xl">{recipe.emoji}</span>
                      <div>
                        <h3 className={`text-3xl font-medium tracking-tight mb-1 ${isJustOrdered ? 'text-white' : 'text-black'}`}>{recipe.name}</h3>
                        <p className={`text-sm font-medium flex items-center gap-2 ${isJustOrdered ? 'text-white/60' : 'text-black/50'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isJustOrdered ? 'bg-white' : 'bg-black'} block`}></span>
                          {recipe.items} items • {recipe.time} mins
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-medium block ${isJustOrdered ? 'text-white' : 'text-black'}`}>${recipe.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {isJustOrdered ? (
                    <div className="bg-white/10 p-4 rounded-2xl text-center">
                       <p className="text-lg font-bold mb-1">🎉 Order Placed!</p>
                       {isSubNeeded && (
                         <p className="text-[#D1F2D9] font-medium text-sm mt-2 flex flex-col">
                           <span className="uppercase text-xs font-bold opacity-70 tracking-widest mb-1">Smart Sub Activated</span>
                           {requiredItem.sub} replaced {requiredItem.name}
                         </p>
                       )}
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-full">
                      <button 
                        onClick={() => handleOrder(recipe)}
                        className="w-full bg-black text-[#E5D9F2] py-4 rounded-full text-lg font-medium hover:bg-black/80 transition-all btn-liquid active:scale-95"
                      >
                        One-Tap Add to Cart
                      </button>
                    </div>
                  )}
                  
                  {!isJustOrdered && isSubNeeded && (
                     <div className="mt-3 flex items-center gap-2 justify-center text-xs font-bold text-red-600 uppercase tracking-widest bg-red-600/10 py-1 px-3 rounded-full w-max mx-auto">
                       <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                       Low stock on {requiredItem.name}
                     </div>
                  )}
                </div>
                {index < RECIPES.length - 1 && <div className="divider mx-4"></div>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:hidden z-50">
        <div className="home-indicator-circle"></div>
      </div>
    </main>
  );
}

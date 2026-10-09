"use client";
import { useState, useEffect } from 'react';
import { useAppStore, OrderItem } from '@/lib/store';

const RECIPES = [
  { 
    id: 'butter-chicken', 
    name: 'Butter Chicken', 
    basePrice: 12.25, 
    time: 45, 
    emoji: '🍛',
    ingredients: [
      { id: 'chicken', qty: 1 },
      { id: 'heavy_cream', qty: 1 },
      { id: 'tomatoes', qty: 2 }
    ]
  },
  { 
    id: 'avocado-bowl', 
    name: 'Avocado Bowl', 
    basePrice: 9.00, 
    time: 15, 
    emoji: '🥗',
    ingredients: [
      { id: 'avocado', qty: 1 },
      { id: 'quinoa', qty: 1 },
      { id: 'tomatoes', qty: 1 }
    ]
  },
  { 
    id: 'margherita', 
    name: 'Margherita Pizza', 
    basePrice: 10.50, 
    time: 25, 
    emoji: '🍕',
    ingredients: [
      { id: 'pizza_dough', qty: 1 },
      { id: 'tomatoes', qty: 2 },
      { id: 'basil', qty: 1 }
    ]
  },
  { 
    id: 'mango-smoothie', 
    name: 'Mango Smoothie', 
    basePrice: 4.75, 
    time: 5, 
    emoji: '🥭',
    ingredients: [
      { id: 'mango', qty: 1 },
      { id: 'milk', qty: 1 }
    ]
  },
];

export default function CustomerApp() {
  const { state, updateState } = useAppStore();
  const [justOrdered, setJustOrdered] = useState<string | null>(null);
  const [portions, setPortions] = useState(2);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleOrder = (recipe: typeof RECIPES[0]) => {
    
    const orderItems: OrderItem[] = [];
    const newInventory = { ...state.inventory };
    let hasSub = false;

    for (const req of recipe.ingredients) {
      const invItem = newInventory[req.id];
      const neededQty = req.qty * portions;
      const isOutOfStock = invItem.stock < neededQty;

      orderItems.push({
        ingredientId: req.id,
        name: invItem.name,
        qty: neededQty,
        substituted: isOutOfStock,
        subName: isOutOfStock ? invItem.sub : undefined
      });

      if (isOutOfStock) hasSub = true;
      else {
        newInventory[req.id] = { ...invItem, stock: invItem.stock - neededQty };
      }
    }

    const newOrder = {
      id: `ORD-${Math.floor(Math.random() * 1000) + 1000}`,
      recipe: recipe.name,
      portions,
      price: recipe.basePrice * portions,
      status: 'pending' as const,
      items: orderItems,
      timestamp: Date.now(),
    };

    updateState(prev => ({
      ...prev,
      inventory: newInventory,
      orders: [newOrder, ...prev.orders]
    }));

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
        <div className="bg-black/5 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-4">
          <span>Portions:</span>
          <div className="flex gap-2">
            {[1, 2, 4].map(p => (
              <button 
                key={p} 
                onClick={() => setPortions(p)}
                className={`w-8 h-8 rounded-full font-bold ${portions === p ? 'bg-black text-white' : 'bg-black/10'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-md mx-auto w-full pb-32">
        <h1 className="text-7xl font-medium leading-[0.95] tracking-[-0.05em] mb-16 animate-reveal delay-100">
          What are<br/>you cooking<br/>today?
        </h1>
        
        <div className="space-y-2">
          {RECIPES.map((recipe, index) => {
            const isJustOrdered = justOrdered === recipe.id;
            
            // Preview check for subs
            const willHaveSub = recipe.ingredients.some(req => state.inventory[req.id].stock < req.qty * portions);

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
                          {recipe.ingredients.length} items • {recipe.time} mins
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-medium block ${isJustOrdered ? 'text-white' : 'text-black'}`}>${(recipe.basePrice * portions).toFixed(2)}</span>
                    </div>
                  </div>

                  {isJustOrdered ? (
                    <div className="bg-white/10 p-4 rounded-2xl text-center">
                       <p className="text-lg font-bold mb-1">🎉 Order Placed!</p>
                       <p className="text-white/60 text-sm">Ingredient stack sent to rider.</p>
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
                  
                  {!isJustOrdered && willHaveSub && (
                     <div className="mt-3 flex items-center gap-2 justify-center text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-600/10 py-1.5 px-3 rounded-full w-max mx-auto">
                       <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                       Smart Sub Available for out of stock items
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

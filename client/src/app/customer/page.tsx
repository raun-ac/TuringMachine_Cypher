"use client";
import { useState, useEffect } from 'react';
import { useAppStore, OrderItem, Order } from '@/lib/store';
import { RECIPES } from '@/lib/recipes';

const CATEGORIES = ['All', 'Indian', 'Chinese', 'Italian', 'American', 'Healthy'];

const isVeg = (recipe: typeof RECIPES[0]) => {
  const nonVegIds = ['chicken', 'lamb', 'beef_patty', 'salmon', 'eggs'];
  return !recipe.ingredients.some(ing => nonVegIds.includes(ing.id));
};

const getCategoryColor = (recipe: typeof RECIPES[0]) => {
  if (isVeg(recipe)) {
    return 'bg-[#F0FDF4] border-[#BBF7D0]'; // Lighter green (green-50, green-200)
  } else {
    return 'bg-[#FEF2F2] border-[#FECACA]'; // Lighter red (red-50, red-200)
  }
};

export default function CustomerApp() {
  const { state, updateState } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [mounted, setMounted] = useState(false);
  
  const [servingsMap, setServingsMap] = useState<Record<string, number>>({});
  const [orderedStacks, setOrderedStacks] = useState<Record<string, OrderItem[]>>({});
  const [configuringId, setConfiguringId] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const getServings = (id: string) => servingsMap[id] || 1;
  const setServings = (id: string, val: number) => setServingsMap(prev => ({...prev, [id]: val}));

  const handleOrder = (recipe: typeof RECIPES[0]) => {
    const servings = getServings(recipe.id);
    const orderItems: OrderItem[] = [];
    const newInventory = { ...state.inventory };
    let hasSub = false;

    for (const req of recipe.ingredients) {
      const invItem = newInventory[req.id] || { name: req.id, stock: 0 };
      const neededQty = req.qty * servings;
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

    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 1000) + 1000}`,
      recipe: recipe.name,
      portions: servings,
      price: recipe.basePrice * servings,
      status: 'pending',
      items: orderItems,
      timestamp: Date.now(),
    };

    updateState(prev => ({
      ...prev,
      inventory: newInventory,
      orders: [newOrder, ...prev.orders]
    }));

    setConfiguringId(null);
    setOrderedStacks(prev => ({ ...prev, [recipe.id]: orderItems }));
    
    setTimeout(() => {
      setOrderedStacks(prev => {
        const next = { ...prev };
        delete next[recipe.id];
        return next;
      });
      setServings(recipe.id, 1);
    }, 6000);
  };

  if (!mounted) return null;

  const filteredRecipes = RECIPES.filter(r => activeCategory === 'All' || r.category === activeCategory);

  return (
    <main className="min-h-screen bg-[#F3F4F6] text-black pb-32 flex flex-col relative overflow-hidden">
      
      {/* Sticky Header with Categories */}
      <div className="sticky top-0 z-40 bg-[#F3F4F6]/85 backdrop-blur-xl pt-6 pb-2 px-6 md:px-12 border-b border-black/5 shadow-sm">
        <nav className="flex justify-between items-center mb-6 animate-reveal max-w-7xl mx-auto w-full">
          <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-black tracking-tighter text-xl shadow-lg">
            JD
          </div>
          <div className="bg-white/60 border border-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-4 shadow-sm">
            <span className="text-black font-medium tracking-tight">Delivery to: <span className="font-bold">Home</span></span>
          </div>
        </nav>

        {/* Categories Carousel */}
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] animate-reveal delay-100 md:justify-center">
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap snap-start transition-all duration-300 border-2 ${activeCategory === cat ? 'bg-black text-white border-black shadow-lg scale-105' : 'bg-white border-black/5 hover:border-black/20 text-black/70 hover:text-black'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 pt-12 md:px-12 flex flex-col items-center">
        
        {/* Fixed Title Alignment */}
        <div className="w-full max-w-4xl mx-auto text-center mb-16 animate-reveal delay-200">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium leading-[0.95] tracking-[-0.03em] break-words">
            {activeCategory === 'All' ? 'What are you cooking today?' : `${activeCategory} Classics for you.`}
          </h1>
        </div>
        
        {/* Horizontal Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {filteredRecipes.length === 0 ? (
            <p className="text-center font-medium text-black/40 py-12 text-xl col-span-full">No recipes found for this category.</p>
          ) : (
            filteredRecipes.map((recipe, index) => {
              const orderedStack = orderedStacks[recipe.id];
              const isConfiguring = configuringId === recipe.id;
              const servings = getServings(recipe.id);
              const willHaveSub = recipe.ingredients.some(req => (state.inventory[req.id]?.stock || 0) < req.qty * servings);
              const vegStatus = isVeg(recipe);

              return (
                <div 
                  key={recipe.id} 
                  className={`group animate-reveal`} 
                  style={{ animationDelay: `${(index % 10) * 0.1}s` }}
                >
                  <div className={`p-6 md:p-8 rounded-[2rem] transition-all duration-500 border-2 h-full ${orderedStack ? 'bg-black text-[#E5D9F2] border-black scale-[1.02] shadow-2xl' : `${getCategoryColor(recipe)} hover:shadow-xl`}`}>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 h-full">
                      
                      {/* Left: Info */}
                      <div className="flex items-center gap-5 flex-1 w-full">
                        <span className="text-6xl md:text-7xl drop-shadow-sm">{recipe.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${vegStatus ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${orderedStack ? 'text-white/50' : 'text-black/50'}`}>{recipe.category}</p>
                          </div>
                          
                          <h3 className={`text-2xl md:text-3xl font-bold tracking-tight mb-2 leading-none ${orderedStack ? 'text-white' : 'text-black'}`}>{recipe.name}</h3>
                          
                          <div className="flex items-center gap-3">
                            <p className={`text-sm font-medium flex items-center gap-2 ${orderedStack ? 'text-white/70' : 'text-black/60'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${orderedStack ? 'bg-white' : 'bg-black'} block`}></span>
                              {recipe.time} mins
                            </p>
                            {!orderedStack && willHaveSub && isConfiguring && (
                               <div className="flex items-center gap-1.5 text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-600/10 border border-red-600/20 py-1 px-2.5 rounded-full shadow-sm">
                                 <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                                 Smart Sub
                               </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions or Stack */}
                      <div className="w-full sm:w-auto flex-shrink-0 mt-4 sm:mt-0">
                        {orderedStack ? (
                          <div className="bg-white/10 p-5 rounded-3xl border border-white/20 w-full sm:min-w-[250px]">
                             <p className="text-sm md:text-base font-bold mb-3 flex items-center gap-2 text-white">
                               <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                               Stack dispatched!
                             </p>
                             <ul className="space-y-2">
                                {orderedStack.map((item, idx) => (
                                  <li key={idx} className="flex items-center gap-3 font-medium text-xs md:text-sm text-white/90">
                                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">{item.qty}</span>
                                    {item.substituted ? (
                                      <span className="flex flex-col leading-tight">
                                        <span className="line-through text-red-400 opacity-80">{item.name}</span>
                                        <span className="text-red-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">↳ Sub: {item.subName}</span>
                                      </span>
                                    ) : (
                                      <span>{item.name}</span>
                                    )}
                                  </li>
                                ))}
                             </ul>
                          </div>
                        ) : isConfiguring ? (
                          <div className="flex flex-col gap-3 w-full sm:w-56 animate-reveal ml-auto">
                            <div className="flex items-center justify-between bg-black/5 p-1 rounded-full border border-black/10">
                              <button 
                                onClick={() => setServings(recipe.id, Math.max(1, servings - 1))}
                                className="w-10 h-10 rounded-full bg-white text-black font-black text-xl flex items-center justify-center shadow-sm hover:bg-black/5 transition-colors flex-shrink-0 leading-none pb-1"
                              >-</button>
                              <span className="font-bold text-lg flex-1 text-center">{servings}</span>
                              <button 
                                onClick={() => setServings(recipe.id, servings + 1)}
                                className="w-10 h-10 rounded-full bg-white text-black font-black text-xl flex items-center justify-center shadow-sm hover:bg-black/5 transition-colors flex-shrink-0 leading-none pb-1"
                              >+</button>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setConfiguringId(null)}
                                className="px-4 py-3 rounded-full text-[13px] font-bold bg-black/10 hover:bg-black/20 transition-colors flex-shrink-0"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => handleOrder(recipe)}
                                className="flex-1 bg-black text-white py-3 px-2 rounded-full text-[13px] font-bold hover:bg-black/80 transition-all btn-liquid active:scale-95 shadow-md flex justify-center items-center whitespace-nowrap"
                              >
                                Confirm • ₹{recipe.basePrice * servings}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full gap-4">
                            <span className="text-3xl md:text-4xl font-black block text-black">₹{recipe.basePrice}</span>
                            <button 
                              onClick={() => setConfiguringId(recipe.id)}
                              className="bg-black text-white px-6 h-12 rounded-full flex items-center justify-center text-sm font-bold hover:bg-black/80 transition-all active:scale-95 shadow-md flex-shrink-0"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                      
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:hidden z-50">
        <div className="home-indicator-circle"></div>
      </div>
    </main>
  );
}

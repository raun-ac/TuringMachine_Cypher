"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, OrderItem, Order } from '@/lib/store';
import { RECIPES } from '@/lib/recipes';
import { getCartPersonalityMessage } from '@/lib/messageEngine';

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
  const router = useRouter();
  const { state, updateState } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [mounted, setMounted] = useState(false);

  const [servingsMap, setServingsMap] = useState<Record<string, number>>({});
  const [orderedStacks, setOrderedStacks] = useState<Record<string, OrderItem[]>>({});
  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [mapCenter, setMapCenter] = useState('New York');
  const [eta, setEta] = useState(12);
  const [zoomLevel, setZoomLevel] = useState(1);
  const TOTAL_TRACKING_SECONDS = 60; // 60 seconds for the simulation
  const INITIAL_ETA = 12;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isTracking) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setMapCenter(`${pos.coords.latitude},${pos.coords.longitude}`),
          () => console.log("Geolocation denied")
        );
      }
      
      // Sync ETA reduction perfectly with the 60s route animation
      // 12 mins -> 0 mins over 60 seconds = 1 min reduction every 5 seconds
      const interval = setInterval(() => {
        setEta(prev => Math.max(0, prev - 1));
      }, (TOTAL_TRACKING_SECONDS / INITIAL_ETA) * 1000); 
      
      return () => clearInterval(interval);
    } else {
      setEta(INITIAL_ETA);
      setMapCenter('New York');
    }
  }, [isTracking]);

  const getServings = (id: string) => servingsMap[id] || 1;
  const setServings = (id: string, val: number) => setServingsMap(prev => ({ ...prev, [id]: val }));

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
      status: 'cart',
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

  const removeOrder = (orderId: string) => {
    updateState(prev => ({
      ...prev,
      orders: prev.orders.filter(o => o.id !== orderId)
    }));
  };

  const updateOrderPortions = (orderId: string, delta: number) => {
    updateState(prev => {
      const nextOrders = prev.orders.map(o => {
        if (o.id === orderId) {
          const newPortions = Math.max(1, o.portions + delta);
          const r = RECIPES.find(recipe => recipe.name === o.recipe);
          if (r) {
            return { ...o, portions: newPortions, price: r.basePrice * newPortions };
          }
        }
        return o;
      });
      return { ...prev, orders: nextOrders };
    });
  };

  const handleCheckout = () => {
    updateState(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.status === 'cart' ? { ...o, status: 'pending' } : o)
    }));
    setIsCartOpen(false);
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCheckoutSuccess(false);
    }, 4000);
  };

  if (!mounted) return null;

  const filteredRecipes = RECIPES.filter(r => activeCategory === 'All' || r.category === activeCategory);

  // Cart calculations
  const cartOrders = state.orders.filter(o => o.status === 'cart');
  const totalDishes = cartOrders.length;
  const totalPrice = cartOrders.reduce((sum, o) => sum + o.price, 0);
  const totalIngredients = cartOrders.reduce((sum, o) => sum + o.items.length, 0);

  let topMessage = "";
  const isInteracting = configuringId || Object.keys(orderedStacks).length > 0;
  if (isInteracting || cartOrders.length > 0) {
    const generated = getCartPersonalityMessage(cartOrders, configuringId);
    if (generated) topMessage = generated;
  }

  return (
    <main className="min-h-screen bg-[#F3F4F6] text-black pb-40 flex flex-col relative overflow-hidden">
      
      {/* Sticky Header with Categories */}
      <div className="sticky top-0 z-40 bg-[#F3F4F6]/85 backdrop-blur-xl border-b border-black/5 shadow-sm flex flex-col">
        
        {/* MASSIVE DYNAMIC PERSONALITY BANNER */}
        {topMessage && (isInteracting || state.orders.length > 0) && (
          <div className="w-full bg-[#E5D9F2]/90 backdrop-blur-3xl shadow-sm relative z-50 border-b border-black/5 animate-reveal">
            <div className="w-full px-6 py-8 md:py-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay"></div>
              <p className="text-3xl md:text-4xl lg:text-5xl font-serif italic text-black/90 tracking-[-0.02em] leading-tight max-w-5xl mx-auto drop-shadow-sm">
                "{topMessage}"
              </p>
            </div>
          </div>
        )}

        <div className="pt-6 pb-2 px-6 md:px-12 w-full">
          <nav className="flex justify-between items-center mb-6 animate-reveal max-w-7xl mx-auto w-full relative">
            <div className="text-2xl md:text-3xl font-black italic tracking-tight">
              <span className="text-[#EA4335]">Food</span>
              <span className="text-[#34A853]">Mode</span>
            </div>

            <div className="flex items-center gap-3 ml-auto relative z-50 flex-shrink-0">
              <div className="bg-white/60 border border-white px-5 py-2.5 rounded-full font-bold text-sm hidden sm:flex items-center gap-4 shadow-sm">
                <span className="text-black font-medium tracking-tight">Delivery to: <span className="font-bold">Home</span></span>
              </div>
              
              <button 
                onClick={() => setIsCartOpen(true)}
                className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center relative shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                {totalDishes > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black border-2 border-black">{totalDishes}</span>}
              </button>

              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="bg-gray-100 text-gray-800 w-12 h-12 rounded-full flex items-center justify-center border-2 border-transparent hover:border-gray-200 transition-all shadow-sm active:scale-95"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-[reveal_0.2s_ease-out]">
                    <div className="flex flex-col py-2">
                      <button className="px-5 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3">
                         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                         Your orders
                      </button>
                      <button className="px-5 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3">
                         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                         Help and Support
                      </button>
                      <button className="px-5 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3">
                         <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                         Edit profile
                      </button>
                      <div className="h-px bg-gray-100 my-1 mx-2"></div>
                      <button onClick={() => router.push('/auth')} className="px-5 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 w-full">
                         <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                         Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                      <div className="flex items-center gap-5 flex-1 min-w-0 w-full">
                        <span className="text-6xl md:text-7xl drop-shadow-sm flex-shrink-0">{recipe.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${vegStatus ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <p className={`text-[10px] font-black uppercase tracking-widest truncate ${orderedStack ? 'text-white/50' : 'text-black/50'}`}>{recipe.category}</p>
                          </div>

                          <h3 className={`text-2xl md:text-3xl font-bold tracking-tight mb-2 leading-tight break-words ${orderedStack ? 'text-white' : 'text-black'}`}>{recipe.name}</h3>

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

      {/* DUAL-PANE CART MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-reveal">
          <div className="bg-white w-full max-w-5xl h-[90vh] min-h-[600px] rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
            
            {/* Close button */}
            <button onClick={() => setIsCartOpen(false)} className="absolute top-4 right-4 md:top-6 md:right-6 z-50 text-white hover:text-yellow-400 bg-black/20 rounded-full p-2 backdrop-blur-md transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            {/* LEFT: CART ITEMS */}
            <div className="flex-1 bg-white p-6 md:p-10 overflow-y-auto flex flex-col relative z-0">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 text-black">Shopping Cart</h2>
              
              {cartOrders.length === 0 ? (
                <div className="flex-1 flex items-center justify-center flex-col text-gray-400">
                  <span className="text-6xl mb-4">🛒</span>
                  <p className="font-bold uppercase tracking-widest text-sm">Cart is empty</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6 flex-1">
                  {cartOrders.map(order => {
                    const recipe = RECIPES.find(r => r.name === order.recipe);
                    return (
                      <div key={order.id} className="flex flex-col py-4 border-b border-gray-100">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
                          <div className="relative flex-shrink-0">
                            <div className="absolute -inset-2 bg-yellow-400 rounded-lg -z-10 w-12 h-full top-0 left-0 shadow-sm"></div>
                            <span className="text-4xl relative z-10">{recipe?.emoji}</span>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <h4 className="font-black text-sm uppercase tracking-tight text-black">{order.recipe}</h4>
                            <div className="flex flex-col gap-2 mt-1 items-start">
                              <p className="text-xs text-gray-400 line-clamp-1">{recipe?.description}</p>
                              <button 
                                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} 
                                className="text-[10px] font-black text-yellow-500 uppercase tracking-widest hover:text-yellow-600 transition-colors w-fit flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-100"
                              >
                                Ingredients {expandedOrderId === order.id ? '▲' : '▼'}
                              </button>
                            </div>
                          </div>
                          <div className="font-black text-sm text-black">₹{order.price}</div>
                          
                          <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-1 bg-white">
                            <button onClick={() => updateOrderPortions(order.id, -1)} className="w-6 h-6 flex items-center justify-center font-bold text-gray-400 hover:text-black">-</button>
                            <span className="text-xs font-black w-4 text-center">{order.portions.toString().padStart(2, '0')}</span>
                            <button onClick={() => updateOrderPortions(order.id, 1)} className="w-6 h-6 flex items-center justify-center font-bold text-gray-400 hover:text-black">+</button>
                          </div>
                          <button onClick={() => removeOrder(order.id)} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:text-black hover:border-black transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </div>

                        {/* Accordion content */}
                        {expandedOrderId === order.id && (
                          <div className="pl-[72px] pr-2 pt-4 pb-2 animate-reveal">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-inner">
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-3">Order Composition</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                                {order.items.map(item => (
                                  <div key={item.ingredientId} className="flex items-center justify-between gap-2 text-xs font-medium">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-1.5 h-1.5 rounded-full ${item.substituted ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                                      <span className={item.substituted ? 'text-orange-700' : 'text-black/70'}>
                                        {item.substituted ? item.subName : item.name}
                                      </span>
                                    </div>
                                    <span className="text-black/40 font-mono">{item.qty}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {cartOrders.length > 0 && (
                <div className="mt-8 flex justify-between items-center border-t-2 border-black pt-6">
                  <span className="font-black text-sm tracking-widest uppercase text-black">Subtotal</span>
                  <span className="font-black text-xl text-black">₹{totalPrice}</span>
                </div>
              )}
            </div>

            {/* RIGHT: PAYMENT */}
            <div className="w-full md:w-[380px] lg:w-[420px] bg-[#2A2A2A] text-white p-6 md:p-10 flex flex-col relative flex-shrink-0 z-10">
              <div className="flex-1">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 text-white">Payment</h2>
                
                <div className="space-y-4 mb-8 border-b border-white/10 pb-8">
                  <label className="flex items-center gap-3 text-sm font-bold text-white/80 cursor-pointer hover:text-white transition-colors">
                    <input type="radio" name="payment" className="accent-yellow-400 w-4 h-4" /> Cash On Delivery (COD)
                  </label>
                  <label className="flex items-center gap-3 text-sm font-bold text-white cursor-pointer">
                    <input type="radio" name="payment" defaultChecked className="accent-yellow-400 w-4 h-4" /> Online Payment
                  </label>
                </div>

                <div className="flex gap-3 mb-8">
                   <div className="border border-white/20 px-6 py-3 rounded-lg bg-black/40 text-xs font-black uppercase tracking-widest flex-1 text-center cursor-pointer hover:bg-white/10 transition-colors">PayPal</div>
                   <div className="border border-transparent px-6 py-3 rounded-lg bg-white text-black text-xs font-black uppercase tracking-widest flex-1 text-center shadow-md">VISA</div>
                </div>

                <div className="space-y-6">
                   <input type="text" placeholder="Cardholder Name" className="w-full bg-transparent border-b border-white/20 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 transition-colors font-medium" />
                   <input type="text" placeholder="Card Number" className="w-full bg-transparent border-b border-white/20 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 transition-colors font-medium font-mono" />
                   <div className="flex gap-6">
                     <input type="text" placeholder="Exp. Date" className="w-full bg-transparent border-b border-white/20 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 transition-colors font-medium font-mono" />
                     <input type="text" placeholder="CVV" className="w-full bg-transparent border-b border-white/20 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400 transition-colors font-medium font-mono" />
                   </div>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={cartOrders.length === 0}
                className="w-full bg-yellow-400 text-black font-black uppercase tracking-widest text-sm py-5 mt-8 hover:bg-yellow-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 rounded-lg shadow-[0_4px_20px_rgba(250,204,21,0.3)]"
              >
                Checkout <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS OVERLAY */}
      {checkoutSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-reveal">
          <div className="bg-white p-8 md:p-12 rounded-[2rem] text-center max-w-sm w-full shadow-2xl relative overflow-hidden flex flex-col items-center">
             <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
               <span className="text-5xl">🎉</span>
             </div>
             <h3 className="text-2xl font-black uppercase tracking-tighter text-black mb-2">Order Placed!</h3>
             <p className="text-gray-500 font-medium mb-6">Your order was successfully placed and will be delivered to you shortly.</p>
             <button onClick={() => { setCheckoutSuccess(false); setIsTracking(true); }} className="w-full bg-black text-white font-bold uppercase tracking-widest text-sm py-4 rounded-xl hover:bg-black/80 transition-colors active:scale-95">
               Track Order
             </button>
          </div>
        </div>
      )}

      {/* LIVE TRACKING OVERLAY */}
      {isTracking && (
        <div className="fixed inset-0 z-[300] bg-white animate-[reveal_0.4s_ease-out] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-20 shadow-sm relative">
            <div>
              <h2 className="text-xl font-black italic tracking-tight">Live Tracking</h2>
              <p className="text-gray-500 text-sm font-medium">Order #ORD-2839</p>
            </div>
            <button onClick={() => setIsTracking(false)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200 transition-colors">
              ✕
            </button>
          </div>

          <div className="flex-1 relative w-full h-full bg-[#E5E3DF] overflow-hidden">
            
            {/* Custom Zoom Controls */}
            <div className="absolute inset-0 z-50 pointer-events-none flex flex-col gap-3 items-end justify-start p-6 top-[15%] right-0 md:right-4">
              <button 
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.3, 3))} 
                className="w-12 h-12 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center pointer-events-auto text-black text-2xl font-black hover:bg-gray-50 active:scale-95 transition-all"
              >
                +
              </button>
              <button 
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.3, 0.5))} 
                className="w-12 h-12 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center pointer-events-auto text-black text-3xl font-black hover:bg-gray-50 active:scale-95 transition-all leading-none pb-1"
              >
                -
              </button>
            </div>

            <div 
              className="w-full h-full origin-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Embedded Google Map */}
              <iframe 
                  src={`https://maps.google.com/maps?q=${mapCenter}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.85] mix-blend-luminosity grayscale-[30%]"
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
              
              {/* Simulated Live Tracking Path (SVG) with STRICT Rider Motion */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 100 1150 800" preserveAspectRatio="xMidYMid meet">
                <path 
                  id="deliveryRoute"
                  d="M 150,750 L 150,550 L 350,550 L 350,350 L 550,350 L 550,250 L 850,250 L 850,450 L 1000,450" 
                  fill="none" 
                  stroke="#2B64E3" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-90 drop-shadow-md"
                />
                
                {/* Pickup Pin */}
                <g transform="translate(150, 750)">
                  <circle cx="0" cy="0" r="6" fill="black" />
                  <foreignObject x="-40" y="-35" width="80" height="26">
                    <div className="bg-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-sm border border-gray-200 flex items-center justify-center gap-1.5 w-max mx-auto">
                      <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg> Pickup
                    </div>
                  </foreignObject>
                </g>

                {/* Dropoff Pin */}
                <g transform="translate(1000, 450)">
                  <circle cx="0" cy="0" r="7" fill="black" />
                  <circle cx="0" cy="0" r="20" fill="#2B64E3" className="opacity-20 animate-ping" />
                  <foreignObject x="-40" y="-35" width="80" height="26">
                    <div className="bg-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-sm border border-gray-200 flex items-center justify-center gap-1.5 w-max mx-auto">
                       <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg> Dropoff
                    </div>
                  </foreignObject>
                </g>

                {/* Top-down vehicle perfectly following and rotating along the path */}
                <g>
                  <foreignObject x="-24" y="-12" width="48" height="24">
                    <div className="w-full h-full bg-[#1A1A1A] rounded-md shadow-2xl border border-gray-700 relative">
                       {/* Windshield */}
                       <div className="absolute right-3 top-1 bottom-1 w-2 bg-gray-900 rounded-sm"></div>
                       <div className="absolute left-2 top-1 bottom-1 w-1.5 bg-gray-900 rounded-sm"></div>
                       {/* Headlights (right side is the front) */}
                       <div className="absolute right-0 top-1 w-1 h-1.5 bg-white rounded-full shadow-[2px_0_6px_#fff]"></div>
                       <div className="absolute right-0 bottom-1 w-1 h-1.5 bg-white rounded-full shadow-[2px_0_6px_#fff]"></div>
                       {/* Taillights */}
                       <div className="absolute left-0 top-1 w-0.5 h-1.5 bg-red-500 rounded-full shadow-[-2px_0_4px_#ef4444]"></div>
                       <div className="absolute left-0 bottom-1 w-0.5 h-1.5 bg-red-500 rounded-full shadow-[-2px_0_4px_#ef4444]"></div>
                    </div>
                  </foreignObject>
                  <animateMotion dur="60s" repeatCount="1" fill="freeze" rotate="auto">
                    <mpath href="#deliveryRoute" />
                  </animateMotion>
                </g>
              </svg>
            </div>

            {/* Floating ETA Timeline Card */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-30">
              <div className="bg-white rounded-[2rem] p-6 shadow-2xl border border-gray-100 flex flex-col gap-5">
                <div>
                  <h3 className="text-xl font-bold text-black tracking-tight mb-1">Your order is {eta} min away</h3>
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-2">License Plate: <span className="bg-gray-100 px-2 py-0.5 rounded font-mono font-bold text-gray-700">MH 12 AB 1234</span></p>
                </div>

                <div className="bg-gray-50 rounded-[1.5rem] p-5 border border-gray-100 flex flex-col gap-6 relative">
                   {/* Vertical Line */}
                   <div className="absolute left-[31px] top-8 bottom-8 w-[2px] bg-gray-200 rounded-full"></div>

                   <div className="flex items-center gap-4 relative z-10">
                     <div className="w-5 h-5 rounded-full border-[5px] border-black bg-white flex-shrink-0 shadow-sm z-10"></div>
                     <div className="flex-1 flex justify-between items-center">
                        <div>
                          <p className="text-[15px] font-bold text-black">Pickup</p>
                          <p className="text-xs font-medium text-gray-500">Vehicle departed</p>
                        </div>
                        <p className="text-xs font-bold text-gray-800">8:27 pm</p>
                     </div>
                   </div>

                   <div className="flex items-center gap-4 relative z-10">
                     <div className="w-5 h-5 rounded-full bg-black flex-shrink-0 flex items-center justify-center shadow-md z-10">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                     </div>
                     <div className="flex-1 flex justify-between items-center">
                        <div>
                          <p className="text-[15px] font-bold text-black">Home</p>
                          <p className="text-xs font-bold text-yellow-600">Arriving in {eta} min</p>
                        </div>
                        <p className="text-xs font-bold text-gray-800">8:39 pm</p>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:hidden z-40 pointer-events-none">
        <div className="home-indicator-circle"></div>
      </div>
    </main>
  );
}

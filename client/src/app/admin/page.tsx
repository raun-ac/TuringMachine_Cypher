"use client";
import { useState, useEffect } from 'react';
import { useAppStore, defaultState } from '@/lib/store';

export default function AdminDashboard() {
  const { state, updateState } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const inventoryEntries = Object.entries(state.inventory);
  const activeAlerts = inventoryEntries.filter(([_, item]) => item.stock <= 0);

  const resetDemo = () => {
    updateState(() => defaultState);
  };

  return (
    <main className="min-h-screen bg-[#D4E5F2] text-black flex flex-col relative overflow-hidden">
      
      {/* Ticker Tape */}
      <div className="bg-black text-[#D4E5F2] overflow-hidden py-3 border-b border-white/10">
        <div className="animate-ticker text-sm font-bold uppercase tracking-widest flex gap-12 whitespace-nowrap px-6">
          {activeAlerts.length > 0 ? (
            <>
              {Array(4).fill(0).map((_, i) => (
                <span key={i} className="text-red-400">⚠️ CRITICAL ALERT: {activeAlerts[0][1].name} is OUT OF STOCK. Subbing with {activeAlerts[0][1].sub}.</span>
              ))}
            </>
          ) : (
            <>
              {Array(4).fill(0).map((_, i) => (
                <span key={i}>ALL SYSTEMS NOMINAL • INVENTORY LEVELS STABLE • ZERO-FRICTION ACTIVE</span>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="p-6 md:p-12 flex flex-col lg:flex-row gap-12 flex-1">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex flex-col animate-reveal">
          <nav className="flex justify-between items-center mb-16">
            <div className="px-4 py-2 bg-black/10 rounded-full text-xs font-bold uppercase tracking-widest">
              Admin
            </div>
            <button 
              onClick={resetDemo}
              className="text-xs font-bold uppercase tracking-widest bg-black text-[#D4E5F2] px-4 py-2 rounded-full hover:bg-black/80 transition-transform hover:scale-105 active:scale-95"
            >
              Reset Demo
            </button>
          </nav>
          
          <div className="hidden lg:block">
            <h1 className="text-6xl font-medium leading-[0.95] tracking-[-0.05em] mb-16">
              Store<br/>#04
            </h1>
            
            <div className="p-6 bg-white/40 rounded-3xl mb-12">
               <p className="text-6xl font-medium tracking-tight mb-2">{state.orders.length}</p>
               <p className="text-sm font-medium flex items-center gap-2 text-black/60 uppercase tracking-widest">
                 <span className="w-2 h-2 bg-black block"></span>
                 Total Orders Today
               </p>
            </div>
          </div>
        </aside>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Inventory Grid */}
          <div className="space-y-8 animate-reveal delay-100">
            <h3 className="text-4xl font-medium tracking-tight mb-8">Live Inventory</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {inventoryEntries.map(([key, item]) => {
                const isOut = item.stock <= 0;
                return (
                  <div key={key} className={`p-6 rounded-3xl transition-colors duration-500 ${isOut ? 'bg-red-500 text-white shadow-2xl scale-105' : 'bg-white/40 border border-black/5 hover:bg-white/60'}`}>
                    <p className={`text-5xl font-medium tracking-tight mb-4 ${isOut ? 'animate-pulse' : ''}`}>{item.stock}</p>
                    <p className={`text-sm font-medium ${isOut ? 'text-white/80' : 'text-black/60'}`}>{item.name}</p>
                    {isOut && (
                      <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-xs font-bold uppercase tracking-widest text-red-200">Subbing with:</p>
                        <p className="font-medium text-lg">{item.sub}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live Feed */}
          <div className="animate-reveal delay-200 flex flex-col h-full">
            <h3 className="text-4xl font-medium tracking-tight mb-8">Ingredient Stacks Feed</h3>
            <div className="flex-1 bg-white/40 rounded-3xl p-6 overflow-hidden flex flex-col">
              <div className="space-y-6 flex-1 overflow-y-auto pr-4">
                {state.orders.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                     <p className="text-2xl font-medium text-black/30 text-center">No activity yet.<br/>Waiting for orders...</p>
                  </div>
                ) : (
                  state.orders.map((order, i) => {
                    const hasSub = order.items.some(it => it.substituted);
                    
                    return (
                      <div 
                        key={order.id} 
                        className={`p-6 rounded-3xl transition-all duration-500 ${i === 0 ? 'bg-black text-white scale-100 shadow-xl' : 'bg-white border border-black/10 text-black'}`}
                      >
                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-current border-opacity-10">
                          <div>
                            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${i === 0 ? 'text-white/50' : 'text-black/40'}`}>
                              {new Date(order.timestamp).toLocaleTimeString()} • {order.status}
                            </p>
                            <p className="font-medium text-2xl">{order.recipe} (x{order.portions})</p>
                          </div>
                          <span className={`text-xl font-medium block ${i === 0 ? 'text-[#D4E5F2]' : ''}`}>
                            ₹{order.price}
                          </span>
                        </div>
                        
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${i === 0 ? 'text-white/60' : 'text-black/50'}`}>Packed Stack:</p>
                          <ul className="space-y-2">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-3 font-medium text-sm">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${i===0 ? 'bg-white/20' : 'bg-black/10'}`}>{item.qty}</span>
                                {item.substituted ? (
                                  <span className="text-red-500 flex flex-col">
                                    <span className="line-through opacity-70">{item.name}</span>
                                    <span className="font-bold text-xs uppercase tracking-widest mt-0.5">↳ Sub: {item.subName}</span>
                                  </span>
                                ) : (
                                  item.name
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {hasSub && (
                          <div className={`mt-4 p-3 rounded-xl ${i === 0 ? 'bg-white/10 text-white' : 'bg-red-50 text-red-600'}`}>
                            <p className="text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                              Smart Substitution Auto-Applied
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:hidden z-50">
        <div className="home-indicator-circle"></div>
      </div>
    </main>
  );
}

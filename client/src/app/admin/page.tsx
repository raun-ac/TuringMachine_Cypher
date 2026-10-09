"use client";
import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export default function AdminDashboard() {
  const { state } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isCreamAlert = state.inventory.heavy_cream <= 0;

  return (
    <main className="min-h-screen bg-[#D4E5F2] text-black p-6 md:p-12 flex flex-col md:flex-row gap-12 relative overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex flex-col">
        <nav className="flex justify-between items-center mb-16">
          <div className="px-4 py-2 bg-black/10 rounded-full text-xs font-bold uppercase tracking-widest">
            Admin
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { localStorage.removeItem('antigravity_hackathon_state'); window.location.reload(); }}
              className="text-xs font-bold uppercase tracking-widest bg-red-100 text-red-600 px-3 py-1.5 rounded-full hover:bg-red-200 transition-colors"
            >
              Reset Demo
            </button>
            <button className="text-3xl font-light md:hidden">⌄</button>
          </div>
        </nav>
        
        <div className="hidden md:block">
          <h1 className="text-5xl font-medium leading-[1.0] tracking-[-0.05em] mb-12">
            Store #04
          </h1>
          <ul className="space-y-6 text-2xl font-medium text-black/50 tracking-tight">
            <li className="text-black cursor-pointer">Overview</li>
            <li className="cursor-pointer hover:text-black transition-colors">Inventory ({state.inventory.heavy_cream})</li>
            <li className="cursor-pointer hover:text-black transition-colors">Recipes</li>
          </ul>
        </div>
      </aside>

      <div className="flex-1 max-w-2xl">
        <h2 className="text-7xl font-medium leading-[0.95] tracking-[-0.05em] mb-16 md:hidden">
          Store #04
        </h2>

        {/* Minimalist Bar Chart representation */}
        <div className="mb-16 flex items-end gap-1 h-32 divider pb-2">
           <div className="w-full bg-black/20 h-[30%]"></div>
           <div className="w-full bg-black/40 h-[60%]"></div>
           <div className="w-full bg-black h-full flex items-start justify-center pt-2">
             <span className="text-[#D4E5F2] text-xs font-bold">{state.orders.length}</span>
           </div>
           <div className="w-full bg-black/30 h-[40%]"></div>
           <div className="w-full bg-black/10 h-[20%]"></div>
        </div>

        <div className="space-y-0 mb-24">
          <div className="py-6 divider-top flex justify-between items-start">
             <div>
               <p className="text-8xl font-medium tracking-tight mb-2">{state.orders.length}</p>
               <p className="text-sm font-medium flex items-center gap-2">
                 <span className="w-2 h-2 bg-black block"></span>
                 Active Orders
               </p>
             </div>
             <p className="font-medium text-black/50">+{state.orders.length * 10}%</p>
          </div>
          
          <div className={`py-6 divider-top divider flex justify-between items-start transition-colors duration-500 ${isCreamAlert ? 'bg-red-500/10 -mx-4 px-4 rounded-xl' : ''}`}>
             <div>
               <p className={`text-8xl font-medium tracking-tight mb-2 ${isCreamAlert ? 'text-red-600 animate-pulse' : 'text-black'}`}>
                 {state.inventory.heavy_cream}
               </p>
               <p className="text-sm font-medium flex items-center gap-2">
                 <span className={`w-2 h-2 border block ${isCreamAlert ? 'border-red-600' : 'border-black'}`}></span>
                 Heavy Cream
               </p>
             </div>
             {isCreamAlert && (
               <div className="text-right">
                 <p className="font-bold text-red-600">OUT OF STOCK</p>
                 <p className="font-medium text-red-600/70 text-sm">Auto-Sub: Yogurt Active</p>
               </div>
             )}
          </div>
        </div>

        {/* Live Feed */}
        <div className="mt-12">
          <h3 className="text-2xl font-medium mb-6">Live Activity Feed</h3>
          <div className="space-y-4">
            {state.orders.map((order, i) => (
              <div key={order.id} className="p-4 bg-white/40 border border-black/10 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-black/50 mb-1">{order.id} • {order.status}</p>
                  <p className="font-medium text-lg">{order.recipe}</p>
                  {order.substituted && (
                    <p className="text-xs font-bold text-red-600 mt-1">Substituted: {order.subText}</p>
                  )}
                </div>
                <div className="text-right">
                   <span className="text-sm font-medium block">${order.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {state.orders.length === 0 && (
              <p className="text-black/50 font-medium italic">No orders yet...</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:hidden">
        <div className="home-indicator-circle"></div>
      </div>
    </main>
  );
}

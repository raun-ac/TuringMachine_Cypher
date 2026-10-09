"use client";
import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export default function RiderApp() {
  const { state, updateState } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const pendingOrder = state.orders.find(o => o.status === 'pending');
  const activeOrder = state.orders.find(o => o.status === 'assigned');
  
  const currentOrder = activeOrder || pendingOrder;

  const acceptOrder = () => {
    if (!currentOrder) return;
    updateState(prev => ({
      ...prev,
      orders: prev.orders.map(o => 
        o.id === currentOrder.id ? { ...o, status: 'assigned' } : o
      )
    }));
  };

  return (
    <main className="min-h-screen bg-[#D1F2D9] text-black p-6 md:p-12 flex flex-col relative overflow-hidden">
      <nav className="flex justify-between items-center mb-16 animate-reveal">
        <div className="px-4 py-2 bg-black/10 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
          Rider
        </div>
        <button className="text-3xl font-light">⌄</button>
      </nav>

      <div className="flex-1 max-w-md mx-auto w-full pb-32">
        <h1 className="text-7xl font-medium leading-[0.95] tracking-[-0.05em] mb-12 animate-reveal delay-100">
          {activeOrder ? 'Active\nDelivery' : (pendingOrder ? 'New Delivery\nRequest' : 'Looking for\nOrders...')}
        </h1>
        
        {/* Progress bar mimicking the image exactly */}
        <div className="mb-12 animate-reveal delay-200">
          <div className="flex h-8 bg-black/10 rounded-lg overflow-hidden w-full mb-3">
            <div className={`transition-all duration-1000 ease-out bg-black ${activeOrder ? 'w-4/5' : (pendingOrder ? 'w-1/2' : 'w-0')}`}></div>
            <div className={`transition-all duration-1000 ease-out bg-black/30 ${activeOrder ? 'w-1/5' : (pendingOrder ? 'w-1/4' : 'w-0')}`}></div>
          </div>
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-black/50">
             <span>Distance</span>
             <span>Time</span>
             <span>Pay</span>
          </div>
        </div>

        {currentOrder ? (
          <div className="animate-reveal delay-300">
            <div className="space-y-0 mb-16 bg-white/40 p-6 rounded-3xl shadow-xl">
              <div className="pb-6 border-b border-black/10 flex justify-between items-start">
                 <div>
                   <p className="text-7xl font-medium tracking-tight mb-2">${currentOrder.price.toFixed(2)}</p>
                   <p className="text-sm font-medium flex items-center gap-2">
                     <span className="w-2 h-2 border border-black block"></span>
                     Store #04 • {currentOrder.id}
                   </p>
                 </div>
                 <p className="font-medium text-black/50">+1.2mi</p>
              </div>
              
              <div className="pt-6 flex justify-between items-start">
                 <div>
                   <p className="text-7xl font-medium tracking-tight mb-2">8<span className="text-4xl">min</span></p>
                   <p className="text-sm font-medium flex items-center gap-2">
                     <span className={`w-2 h-2 block ${activeOrder ? 'bg-green-500 animate-pulse' : 'bg-black'}`}></span>
                     Est. Arrival
                   </p>
                 </div>
                 <p className="font-bold text-black uppercase tracking-widest text-xs mt-3">{activeOrder ? 'PICKING UP' : 'ASAP'}</p>
              </div>
            </div>
            
            <div className="relative z-10">
               {!activeOrder ? (
                 <button 
                   onClick={acceptOrder}
                   className="w-full bg-black text-[#D1F2D9] py-5 rounded-full text-xl font-medium hover:bg-black/80 transition-all btn-liquid active:scale-95 shadow-2xl"
                 >
                   Accept Delivery
                 </button>
               ) : (
                 <div className="w-full bg-black/5 border border-black/10 text-black py-5 rounded-full text-center text-xl font-medium flex items-center justify-center gap-3">
                   <span className="w-3 h-3 bg-black rounded-full animate-bounce"></span>
                   Proceed to Store
                 </div>
               )}
            </div>
          </div>
        ) : (
          <div className="py-24 text-center border-t border-b border-black/15 animate-reveal delay-300">
             <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6 opacity-20"></div>
             <p className="text-4xl font-medium tracking-tight text-black/40">No active orders</p>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:hidden z-50">
        <div className="home-indicator-circle"></div>
      </div>
    </main>
  );
}

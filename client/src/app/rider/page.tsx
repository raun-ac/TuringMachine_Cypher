"use client";
import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export default function RiderApp() {
  const { state, updateState } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [startY, setStartY] = useState(0);
  const [showRiderDetails, setShowRiderDetails] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const pendingOrders = state.orders.filter(o => o.status === 'pending');
  const activeOrders = state.orders.filter(o => o.status === 'assigned');

  const currentOrders = activeOrders.length > 0 ? activeOrders : pendingOrders;
  const isActive = activeOrders.length > 0;
  const isPending = activeOrders.length === 0 && pendingOrders.length > 0;

  const acceptOrder = () => {
    if (pendingOrders.length === 0) return;
    updateState(prev => ({
      ...prev,
      orders: prev.orders.map(o =>
        o.status === 'pending' ? { ...o, status: 'assigned' } : o
      )
    }));
  };

  const totalPrice = currentOrders.reduce((sum, o) => sum + o.price, 0);
  const batchId = currentOrders.length > 0 ? currentOrders[0].id : '';

  // Group identical ingredients across all dishes in the checkout
  const allItems = currentOrders.flatMap(o => o.items);
  const groupedItems = Object.values(
    allItems.reduce((acc, item) => {
      if (!acc[item.ingredientId]) {
        acc[item.ingredientId] = { ...item };
      } else {
        acc[item.ingredientId].qty += item.qty;
      }
      return acc;
    }, {} as Record<string, typeof allItems[0]>)
  );

  return (
    <main className="min-h-screen bg-[#F4F4F6] text-black flex flex-col relative overflow-hidden font-sans">
      {isActive ? (
        <>
          {/* THE DEMO FAKE MAP (No Google Maps API) */}
          <div className="absolute inset-0 z-0 bg-[#E8EAED] animate-[reveal_0.5s_ease-out]">
            {/* Fake Streets Grid */}
            <svg className="absolute inset-0 w-full h-full opacity-30" width="100%" height="100%">
              <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 80 M 0 0 L 80 80" fill="none" stroke="#9CA3AF" strokeWidth="0.75"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            
            {/* Fake street names scattered around */}
            <div className="absolute top-[25%] left-[15%] text-[11px] text-gray-500 font-bold transform -rotate-45 tracking-widest uppercase">Harrison St</div>
            <div className="absolute top-[40%] left-[30%] text-[11px] text-gray-500 font-bold transform -rotate-45 tracking-widest uppercase">7th St</div>
            <div className="absolute top-[60%] left-[20%] text-[11px] text-gray-500 font-bold tracking-widest uppercase">Utah St</div>
            <div className="absolute top-[50%] left-[60%] text-[11px] text-gray-500 font-bold tracking-widest uppercase">Mariposa St</div>
            <div className="absolute top-[75%] left-[55%] text-[11px] text-gray-400 font-black uppercase tracking-[0.2em]">POTRERO HILL</div>

            {/* Blue Navigation Path */}
            <svg className="absolute inset-0 w-full h-full z-10 drop-shadow-md" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M 20 30 L 35 20 L 45 35 L 60 20 L 70 45 L 80 55 L 75 80" vectorEffect="non-scaling-stroke" fill="none" stroke="#2563EB" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Pickup Marker on map */}
              <circle cx="75" cy="80" r="1.5" fill="#000" stroke="#2563EB" strokeWidth="0.5" />
              {/* Dropoff Marker on map */}
              <path d="M 75 88 Q 75 86 74 86 A 1.5 1.5 0 1 1 76 86 Q 75 86 75 88" fill="#000" />
            </svg>

            {/* Car / Rider Animation */}
            <style>{`
              @keyframes ridePath {
                0%   { top: 30%; left: 20%; transform: translate(-50%, -50%) rotate(56deg); }
                14.9% { top: 20%; left: 35%; transform: translate(-50%, -50%) rotate(56deg); }
                15%  { top: 20%; left: 35%; transform: translate(-50%, -50%) rotate(146deg); }
                24.9% { top: 35%; left: 45%; transform: translate(-50%, -50%) rotate(146deg); }
                25%  { top: 35%; left: 45%; transform: translate(-50%, -50%) rotate(45deg); }
                39.9% { top: 20%; left: 60%; transform: translate(-50%, -50%) rotate(45deg); }
                40%  { top: 20%; left: 60%; transform: translate(-50%, -50%) rotate(158deg); }
                54.9% { top: 45%; left: 70%; transform: translate(-50%, -50%) rotate(158deg); }
                55%  { top: 45%; left: 70%; transform: translate(-50%, -50%) rotate(135deg); }
                74.9% { top: 55%; left: 80%; transform: translate(-50%, -50%) rotate(135deg); }
                75%  { top: 55%; left: 80%; transform: translate(-50%, -50%) rotate(191deg); }
                100% { top: 80%; left: 75%; transform: translate(-50%, -50%) rotate(191deg); }
              }
              .animate-ride {
                animation: ridePath 10s linear forwards;
              }
            `}</style>
            
            {/* The animated Car representing the Rider */}
            <div className="absolute z-20 animate-ride w-6 h-10 bg-[#111] rounded-[6px] shadow-2xl flex items-center justify-center border border-gray-700">
              <div className="w-3.5 h-6 bg-gray-900 rounded-sm"></div>
            </div>

            {/* Map Markers Text Labels */}
            <div className="absolute top-[80%] left-[75%] translate-x-3 -translate-y-5 bg-white px-2.5 py-1.5 rounded-lg shadow-md text-[10px] font-bold z-10 flex items-center gap-1.5 text-gray-800">
              ✎ Pickup
            </div>
            <div className="absolute top-[88%] left-[75%] translate-x-3 -translate-y-2 bg-white px-2.5 py-1.5 rounded-lg shadow-md text-[10px] font-bold z-10 flex items-center gap-1.5 text-gray-800">
              ✎ Dropoff
            </div>
          </div>

          {/* FLOATING TOP BUTTONS */}
          <div className="absolute top-12 right-4 flex flex-col gap-3 z-20">
            <button 
              onClick={() => setShowRiderDetails(true)}
              className="w-11 h-11 bg-white rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.1)] flex items-center justify-center text-gray-800 active:scale-95 transition-transform hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <button className="w-11 h-11 bg-white rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.1)] flex items-center justify-center font-bold text-gray-800 text-lg active:scale-95 transition-transform hover:bg-gray-50">
              ⎎
            </button>
          </div>

          {/* FLOATING INFO */}
          <div className="absolute bottom-[35%] left-6 right-6 z-20 pointer-events-none">
             <h2 className="text-[22px] font-black text-gray-900 drop-shadow-md bg-white/70 w-fit px-3 py-1 rounded-xl backdrop-blur-md mb-1">Navigating to Store</h2>
             <p className="text-gray-800 font-bold text-sm mb-5 bg-white/70 w-fit px-3 py-1 rounded-lg backdrop-blur-md">License Plate: <span className="bg-gray-200 px-1.5 py-0.5 rounded text-black shadow-sm">RDR-842</span></p>
             <button className="bg-white text-black font-bold text-[13px] px-5 py-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 flex items-center gap-2 pointer-events-auto active:scale-95 transition-transform">
               View Order Details
               <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">↗</span>
             </button>
          </div>

          {/* BOTTOM SHEET (Draggable) */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.15)] z-30 p-8 pt-5 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isExpanded ? 'h-[85%]' : 'h-[32%] min-h-[250px]'} animate-[reveal_0.5s_ease-out]`}
          >
             {/* Drag Handle Area */}
             <div 
               className="w-full flex justify-center pb-6 -mt-2 pt-2 cursor-grab active:cursor-grabbing shrink-0"
               onClick={() => setIsExpanded(!isExpanded)}
               onTouchStart={(e) => setStartY(e.touches[0].clientY)}
               onTouchMove={(e) => {
                 const y = e.touches[0].clientY;
                 if (startY - y > 40) setIsExpanded(true); // Drag up
                 if (y - startY > 40) setIsExpanded(false); // Drag down
               }}
             >
               <div className="w-12 h-1.5 bg-gray-200 rounded-full transition-colors hover:bg-gray-300"></div>
             </div>
             
             <div className="flex-1 overflow-y-auto scrollbar-hide">
               {/* TIMELINE */}
               <div className="flex items-start gap-5 shrink-0">
                 <div className="flex flex-col items-center mt-1.5 pb-8 h-full">
                   <div className="w-4 h-4 rounded-full border-[3px] border-black flex items-center justify-center bg-white z-10 shrink-0">
                     <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                   </div>
                   <div className="w-0.5 flex-1 bg-gray-200 my-1 min-h-[60px]"></div>
                   <div className="w-4 h-4 bg-black rounded-full flex shrink-0" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
                 </div>
                 
                 <div className="flex-1 flex flex-col justify-between h-full pb-2">
                   <div className="flex justify-between items-start border-b border-gray-100 pb-5">
                     <div>
                       <p className="font-bold text-gray-900 text-lg">Pickup</p>
                       <p className="text-gray-500 text-sm mt-0.5">Store #04 • Batch {batchId}</p>
                     </div>
                     <p className="font-bold text-gray-900 text-[15px]">8:27 pm</p>
                   </div>
                   
                   <div className="flex justify-between items-start pt-5">
                     <div>
                       <p className="font-bold text-gray-900 text-lg">Customer Dropoff</p>
                       <p className="text-gray-500 text-sm mt-0.5">Downtown Hub, 101 Avenue</p>
                       <p className="text-[#EAB308] text-[11px] font-black mt-1.5 uppercase tracking-widest bg-yellow-50 w-fit px-2 py-0.5 rounded-full">Deliver by 8:45 pm</p>
                     </div>
                     <p className="font-bold text-gray-900 text-[15px]">8:30 pm</p>
                   </div>
                 </div>
               </div>

               {/* INGREDIENT PICKLIST (Revealed on expand) */}
               <div className={`transition-all duration-500 ease-in-out origin-top ${isExpanded ? 'opacity-100 scale-y-100 mt-8 h-auto' : 'opacity-0 scale-y-0 h-0 m-0 overflow-hidden'}`}>
                 <h4 className="font-black uppercase tracking-widest text-xs mb-4 text-black/40">Ingredient Picklist (Stack)</h4>
                 <ul className="space-y-4">
                   {groupedItems.map((item, idx) => (
                     <li key={idx} className="flex items-center justify-between font-bold bg-gray-50 p-4 rounded-2xl border border-gray-100">
                       <span className="flex items-center gap-4">
                         <span className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-sm text-black">{item.qty}</span>
                         <span className={item.substituted ? "text-gray-400 line-through" : "text-black"}>{item.name}</span>
                       </span>
  
                       {item.substituted && (
                         <span className="text-orange-600 text-[10px] font-black uppercase tracking-widest bg-orange-100 px-3 py-1 rounded-full">
                           Sub: {item.subName}
                         </span>
                       )}
                     </li>
                   ))}
                 </ul>
                 
                 <div className="mt-8 bg-green-50 rounded-2xl p-6 border border-green-100 flex items-center justify-between">
                   <div>
                     <p className="text-green-800 font-black text-lg">Total Payout</p>
                     <p className="text-green-600 font-bold text-sm">Including tips</p>
                   </div>
                   <p className="text-4xl font-black text-green-700">₹{totalPrice}</p>
                 </div>
               </div>
             </div>

             <div className="border-t border-gray-100 pt-5 mt-4 flex justify-between shrink-0">
               <button className="text-gray-400 font-bold text-[15px] hover:text-black transition-colors">Cancel</button>
               <button className="text-gray-400 font-bold text-[15px] hover:text-black transition-colors">Contact</button>
             </div>
          </div>
        </>
      ) : (
        /* PENDING ORDERS UI (Green Background) */
        <div className="absolute inset-0 bg-[#D1F2D9] p-6 md:p-12 flex flex-col z-50 overflow-y-auto overflow-x-hidden">
          <nav className="flex justify-between items-center mb-16 animate-reveal">
            <div className="px-4 py-2 bg-black/10 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
              Rider
            </div>
            <button className="text-3xl font-light w-12 h-12 rounded-full flex items-center justify-center bg-black/5">⌄</button>
          </nav>

          <div className="flex-1 max-w-md mx-auto w-full pb-32">
            <h1 className="text-7xl font-medium leading-[0.95] tracking-[-0.05em] mb-12 animate-reveal delay-100">
              {isPending ? 'New Delivery\nRequest' : 'Looking for\nOrders...'}
            </h1>
            
            <div className="mb-12 animate-reveal delay-200">
              <div className="flex h-8 bg-black/10 rounded-lg overflow-hidden w-full mb-3">
                <div className={`transition-all duration-1000 ease-out bg-black ${isPending ? 'w-1/2' : 'w-0'}`}></div>
                <div className={`transition-all duration-1000 ease-out bg-black/30 ${isPending ? 'w-1/4' : 'w-0'}`}></div>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-black/50">
                <span>Distance</span>
                <span>Time</span>
                <span>Pay</span>
              </div>
            </div>

            {currentOrders.length > 0 ? (
              <div className="animate-reveal delay-300">
                <div className="mb-8 bg-white/40 p-6 rounded-3xl shadow-xl">
                  <div className="pb-6 border-b border-black/10 flex justify-between items-start">
                    <div>
                      <p className="text-7xl font-medium tracking-tight mb-2">₹{totalPrice}</p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <span className="w-2 h-2 border border-black block"></span>
                        Store #04 • {batchId}
                      </p>
                    </div>
                    <p className="font-medium text-black/50">+1.2mi</p>
                  </div>
                  
                  <div className="py-6 border-b border-black/10">
                    <h4 className="font-bold uppercase tracking-widest text-xs mb-4 text-black/50">Order Specs</h4>
                    <p className="text-sm font-medium text-black/70">{groupedItems.length} Unique Ingredients needed from store</p>
                  </div>

                  <div className="pt-6 flex justify-between items-start">
                    <div>
                      <p className="text-5xl font-medium tracking-tight mb-1">8<span className="text-2xl">min</span></p>
                      <p className="text-xs font-medium flex items-center gap-2 uppercase tracking-widest text-black/50">
                        Est. Arrival
                      </p>
                    </div>
                    <p className="font-bold text-black uppercase tracking-widest text-xs mt-3">ASAP</p>
                  </div>
                </div>
                
                <button 
                  onClick={acceptOrder}
                  className="w-full bg-black text-[#D1F2D9] py-5 rounded-full text-xl font-medium hover:bg-black/80 transition-all btn-liquid active:scale-95 shadow-2xl"
                >
                  Accept Delivery
                </button>
              </div>
            ) : (
              <div className="py-24 text-center border-t border-b border-black/15 animate-reveal delay-300">
                <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6 opacity-20"></div>
                <p className="text-4xl font-medium tracking-tight text-black/40">No active orders</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RIDER DETAILS MODAL */}
      {showRiderDetails && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-[reveal_0.2s_ease-out]">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-black text-gray-900">Rider Profile</h2>
               <button onClick={() => setShowRiderDetails(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200">✕</button>
             </div>
             
             <div className="flex items-center gap-4 mb-8">
               <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl shadow-inner border-2 border-white outline outline-2 outline-blue-500 shrink-0">
                 👨‍🚀
               </div>
               <div>
                 <p className="font-black text-xl text-gray-900 leading-tight">Alex Walker</p>
                 <p className="text-gray-500 font-bold text-xs mt-1 bg-gray-100 px-2 py-1 rounded-md w-fit">Top Rated Partner</p>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                 <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Rating</p>
                 <p className="text-2xl font-black text-gray-900">4.9<span className="text-[#F59E0B] text-lg ml-1">★</span></p>
               </div>
               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                 <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Deliveries</p>
                 <p className="text-2xl font-black text-gray-900">1,402</p>
               </div>
             </div>
             
             <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6">
               <p className="text-blue-600/60 text-[10px] font-black uppercase tracking-widest mb-2">Current Vehicle</p>
               <p className="font-black text-blue-900 text-lg flex items-center gap-2">
                 🛵 Electric Scooter
               </p>
               <p className="text-blue-700 font-bold text-sm mt-1 bg-white w-fit px-2 py-0.5 rounded shadow-sm">RDR-842</p>
             </div>
             
             <button onClick={() => setShowRiderDetails(false)} className="w-full py-4 bg-black text-white rounded-xl font-bold active:scale-95 transition-transform shadow-lg">
               Close Profile
             </button>
          </div>
        </div>
      )}
    </main>
  );
}

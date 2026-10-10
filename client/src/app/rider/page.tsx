"use client";
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';

export default function RiderApp() {
  const { state, updateState } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [startY, setStartY] = useState(0);
  const [showRiderDetails, setShowRiderDetails] = useState(false);
  const [mapCenter, setMapCenter] = useState('New York');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [deliveryPhase, setDeliveryPhase] = useState<'idle' | 'to_store' | 'at_store' | 'to_customer' | 'delivered'>('idle');
  const [eta, setEta] = useState(0);

  const pendingOrders = state.orders.filter(o => o.status === 'pending');
  const activeOrders = state.orders.filter(o => 
    o.status === 'assigned' || o.status === 'picking' || o.status === 'delivering'
  );
  
  const currentOrders = activeOrders.length > 0 ? activeOrders : pendingOrders;
  const isActive = activeOrders.length > 0;
  const isPending = activeOrders.length === 0 && pendingOrders.length > 0;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && activeOrders.length > 0) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setMapCenter(`${pos.coords.latitude},${pos.coords.longitude}`),
          () => console.log("Geolocation denied")
        );
      }
    } else {
      setMapCenter('New York');
    }
  }, [mounted, activeOrders.length]);

  const acceptOrder = () => {
    if (pendingOrders.length === 0) return;
    updateState(prev => ({
      ...prev,
      orders: prev.orders.map(o =>
        o.status === 'pending' ? { ...o, status: 'assigned', phaseStartTime: Date.now() } : o
      )
    }));
  };

  const updateOrderStatus = (newStatus: 'picking' | 'delivering' | 'completed') => {
    updateState(prev => ({
      ...prev,
      orders: prev.orders.map(o =>
        (o.status === 'assigned' || o.status === 'picking' || o.status === 'delivering') 
          ? { ...o, status: newStatus, phaseStartTime: Date.now() } 
          : o
      )
    }));
  };

  useEffect(() => {
    let phaseTimer: NodeJS.Timeout;
    if (isActive) {
      if (deliveryPhase === 'idle') {
        setDeliveryPhase('to_store');
        setEta(5);
      } else if (deliveryPhase === 'to_store') {
        phaseTimer = setTimeout(() => {
          setDeliveryPhase('at_store');
          updateOrderStatus('picking');
        }, 30000);
      } else if (deliveryPhase === 'at_store') {
        phaseTimer = setTimeout(() => {
          setDeliveryPhase('to_customer');
          setEta(10);
          updateOrderStatus('delivering');
        }, 5000); // 5 seconds wait
      } else if (deliveryPhase === 'to_customer') {
        phaseTimer = setTimeout(() => {
          setDeliveryPhase('delivered');
          updateOrderStatus('completed');
        }, 60000);
      }
    } else {
      setDeliveryPhase('idle');
    }
    return () => clearTimeout(phaseTimer);
  }, [isActive, deliveryPhase]);

  // SVG Animation Time Sync
  useEffect(() => {
    if (svgRef.current && currentOrders[0]?.phaseStartTime) {
      const elapsed = (Date.now() - currentOrders[0].phaseStartTime) / 1000;
      // Small timeout to ensure DOM is ready and animateMotion is mounted
      setTimeout(() => {
        if (svgRef.current) {
          svgRef.current.setCurrentTime(Math.max(0, elapsed));
        }
      }, 50);
    }
  }, [deliveryPhase, currentOrders[0]?.phaseStartTime]);

  // ETA Countdown logic for each phase
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (deliveryPhase === 'to_store') {
      interval = setInterval(() => {
        setEta(prev => Math.max(0, prev - 1));
      }, (30 / 5) * 1000); // 30s to simulate 5 mins -> 6s per min
    } else if (deliveryPhase === 'to_customer') {
      interval = setInterval(() => {
        setEta(prev => Math.max(0, prev - 1));
      }, (60 / 10) * 1000); // 60s to simulate 10 mins -> 6s per min
    }
    return () => clearInterval(interval);
  }, [deliveryPhase]);

  if (!mounted) return null;

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

  const handleMapPointerDown = (e: React.PointerEvent) => {
    setIsDraggingMap(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMapPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingMap) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMapPointerUp = () => {
    setIsDraggingMap(false);
  };

  return (
    <main className="min-h-screen bg-[#F4F4F6] text-black flex flex-col relative overflow-hidden font-sans">
      {isActive ? (
        <>
          {/* THE REAL MAP */}
          <div 
            className="absolute inset-0 z-0 bg-[#E5E3DF] animate-[reveal_0.5s_ease-out] overflow-hidden cursor-grab active:cursor-grabbing"
            onPointerDown={handleMapPointerDown}
            onPointerMove={handleMapPointerMove}
            onPointerUp={handleMapPointerUp}
            onPointerLeave={handleMapPointerUp}
          >
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
              className={`w-full h-full origin-center transition-transform ease-[cubic-bezier(0.16,1,0.3,1)] ${isDraggingMap ? 'duration-0' : 'duration-700'}`}
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})` }}
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
              
              {/* Hidden Paths purely for animation reference */}
              <svg ref={svgRef} key={deliveryPhase} className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 100 1150 800" preserveAspectRatio="xMidYMid meet">
                <path id="toStoreRoute" d="M 150,350 L -50,350 L -50,750 L 150,750" fill="none" />
                <path id="toCustomerRoute" d="M 150,750 L 150,550 L 350,550 L 350,350 L 550,350 L 550,250 L 850,250 L 850,450 L 1000,450" fill="none" />
                
                {/* Visible Combined Route */}
                <path 
                  d="M 150,350 L -50,350 L -50,750 L 150,750 L 150,550 L 350,550 L 350,350 L 550,350 L 550,250 L 850,250 L 850,450 L 1000,450" 
                  fill="none" 
                  stroke="#2B64E3" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-90 drop-shadow-md"
                />

                {/* Rider Start Pin */}
                <g transform="translate(150, 350)">
                  <circle cx="0" cy="0" r="6" fill="#10B981" />
                  <foreignObject x="-40" y="-35" width="80" height="26">
                    <div className="bg-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-sm border border-gray-200 flex items-center justify-center gap-1.5 w-max mx-auto text-green-700">
                      Rider
                    </div>
                  </foreignObject>
                </g>
                
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

                {/* Top-down vehicle dynamic rendering based on phase */}
                {deliveryPhase === 'to_store' && (
                  <g key="to_store">
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
                    <animateMotion dur="30s" repeatCount="1" fill="freeze" rotate="auto">
                      <mpath href="#toStoreRoute" />
                    </animateMotion>
                  </g>
                )}

                {deliveryPhase === 'at_store' && (
                  <g transform="translate(150, 750) rotate(0)">
                    <foreignObject x="-24" y="-12" width="48" height="24">
                      <div className="w-full h-full bg-[#1A1A1A] rounded-md shadow-2xl border border-gray-700 relative">
                         <div className="absolute right-3 top-1 bottom-1 w-2 bg-gray-900 rounded-sm"></div>
                         <div className="absolute left-2 top-1 bottom-1 w-1.5 bg-gray-900 rounded-sm"></div>
                         <div className="absolute right-0 top-1 w-1 h-1.5 bg-white rounded-full shadow-[2px_0_6px_#fff]"></div>
                         <div className="absolute right-0 bottom-1 w-1 h-1.5 bg-white rounded-full shadow-[2px_0_6px_#fff]"></div>
                         <div className="absolute left-0 top-1 w-0.5 h-1.5 bg-red-500 rounded-full shadow-[-2px_0_4px_#ef4444] animate-pulse"></div>
                         <div className="absolute left-0 bottom-1 w-0.5 h-1.5 bg-red-500 rounded-full shadow-[-2px_0_4px_#ef4444] animate-pulse"></div>
                      </div>
                    </foreignObject>
                  </g>
                )}

                {deliveryPhase === 'to_customer' && (
                  <g key="to_customer">
                    <foreignObject x="-24" y="-12" width="48" height="24">
                      <div className="w-full h-full bg-[#1A1A1A] rounded-md shadow-2xl border border-gray-700 relative">
                         <div className="absolute right-3 top-1 bottom-1 w-2 bg-gray-900 rounded-sm"></div>
                         <div className="absolute left-2 top-1 bottom-1 w-1.5 bg-gray-900 rounded-sm"></div>
                         <div className="absolute right-0 top-1 w-1 h-1.5 bg-white rounded-full shadow-[2px_0_6px_#fff]"></div>
                         <div className="absolute right-0 bottom-1 w-1 h-1.5 bg-white rounded-full shadow-[2px_0_6px_#fff]"></div>
                         <div className="absolute left-0 top-1 w-0.5 h-1.5 bg-red-500 rounded-full shadow-[-2px_0_4px_#ef4444]"></div>
                         <div className="absolute left-0 bottom-1 w-0.5 h-1.5 bg-red-500 rounded-full shadow-[-2px_0_4px_#ef4444]"></div>
                      </div>
                    </foreignObject>
                    <animateMotion dur="60s" repeatCount="1" fill="freeze" rotate="auto">
                      <mpath href="#toCustomerRoute" />
                    </animateMotion>
                  </g>
                )}
                
                {deliveryPhase === 'delivered' && (
                  <g transform="translate(1000, 450) rotate(0)">
                    <foreignObject x="-24" y="-12" width="48" height="24">
                      <div className="w-full h-full bg-[#1A1A1A] rounded-md shadow-2xl border border-gray-700 relative opacity-50 transition-opacity">
                         <div className="absolute right-3 top-1 bottom-1 w-2 bg-gray-900 rounded-sm"></div>
                         <div className="absolute left-2 top-1 bottom-1 w-1.5 bg-gray-900 rounded-sm"></div>
                      </div>
                    </foreignObject>
                  </g>
                )}
              </svg>
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
             <h2 className="text-[22px] font-black text-gray-900 drop-shadow-md bg-white/70 w-fit px-3 py-1 rounded-xl backdrop-blur-md mb-1">
               {deliveryPhase === 'to_store' && `Navigating to Store (${eta} min)`}
               {deliveryPhase === 'at_store' && `Picking up order...`}
               {deliveryPhase === 'to_customer' && `Heading to Customer (${eta} min)`}
               {deliveryPhase === 'delivered' && `Order Delivered!`}
             </h2>
             <p className="text-gray-800 font-bold text-sm mb-5 bg-white/70 w-fit px-3 py-1 rounded-lg backdrop-blur-md">License Plate: <span className="bg-gray-200 px-1.5 py-0.5 rounded font-mono text-black shadow-sm">MH 12 AB 1234</span></p>
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

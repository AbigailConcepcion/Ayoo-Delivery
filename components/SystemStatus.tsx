import React from 'react';
import { db } from '../db';
import { COLORS } from '../constants';

const SystemStatus: React.FC = () => {
  // Ginagamit pa rin ang logic para malaman kung may connection, 
  // pero "Online" na ang itatawag natin sa user.
  const isOnline = (db as any).constructor.ENV.USE_REAL_BACKEND;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
       <div className={`backdrop-blur-md px-3 py-1 rounded-full border flex items-center gap-2 shadow-lg transition-all duration-500 bg-black/60 border-white/10`}>
          
          {/* Status Dot */}
          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          
          {/* Location / Status Text */}
          <span className="text-[7px] font-black text-white uppercase tracking-[0.2em]">
            {isOnline ? 'System: Online' : 'System: Offline Mode'}
          </span>

          <div className="w-[1px] h-2 bg-white/20 mx-1"></div>

          {/* Location Indicator - Para magmukhang real app */}
          <div className="flex items-center gap-1">
            <span className="text-[7px] font-black text-white/60 uppercase tracking-[0.2em]">
              GPS: 
            </span>
            <span className="text-[7px] font-black text-green-400 uppercase tracking-[0.2em]">
              Active
            </span>
          </div>
       </div>
    </div>
  );
};

export default SystemStatus;

import React from 'react';
import { db } from '../db';

const SystemStatus: React.FC = () => {
  const isReal = (db as any).constructor.ENV.USE_REAL_BACKEND;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
       <div className={`backdrop-blur-md px-4 py-1.5 rounded-full border flex items-center gap-2 shadow-2xl transition-all duration-500 ${
         isReal ? 'bg-green-950/80 border-green-500/30' : 'bg-black/80 border-white/10'
       }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isReal ? 'bg-green-400' : 'bg-pink-500'}`}></div>
          <span className="text-[8px] font-black text-white/80 uppercase tracking-[0.2em]">
            {isReal ? 'Ayoo Cloud: Production' : 'Ayoo Cloud: Simulator'}
          </span>
          <div className="w-[1px] h-3 bg-white/20 mx-1"></div>
          <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isReal ? 'text-green-400' : 'text-pink-500'}`}>
            {isReal ? 'LIVE API' : 'LOCAL NODES'}
          </span>
       </div>
    </div>
  );
};

export default SystemStatus;

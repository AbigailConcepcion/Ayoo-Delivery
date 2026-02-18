
import React from 'react';

const SystemStatus: React.FC = () => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
       <div className="bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-2xl">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[8px] font-black text-white/80 uppercase tracking-[0.2em]">Ayoo Cloud: Connected</span>
          <div className="w-[1px] h-3 bg-white/20 mx-1"></div>
          <span className="text-[8px] font-black text-pink-500 uppercase tracking-[0.2em]">Region: PH-Iligan</span>
       </div>
    </div>
  );
};

export default SystemStatus;

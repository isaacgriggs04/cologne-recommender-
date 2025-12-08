import React from 'react';

const Background = ({ children }) => {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#FDFCFB]">
      {/* Grain Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />

      {/* Moving Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/20 rounded-full blur-[120px] mix-blend-multiply animate-blob" />
      <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/20 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-pink-200/20 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000" />
      
      {/* Content */}
      <div className="relative z-10 w-full h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default Background;

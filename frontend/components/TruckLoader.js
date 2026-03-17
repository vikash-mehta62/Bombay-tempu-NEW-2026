'use client';

import { Truck } from 'lucide-react';

export default function TruckLoader({ size = 'md', message = 'Optimizing Routes...' }) {
  // Icon sizes mapping
  const iconSizes = {
    sm: 24,
    md: 40,
    lg: 64,
    xl: 80
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/50 backdrop-blur-sm rounded-xl">
      <div className="relative flex flex-col items-center">
        {/* Truck Icon with Shake/Drive Animation */}
        <div className="animate-bounce mb-1">
          <Truck 
            size={iconSizes[size]} 
            className="text-[#1d3394] fill-[#1d3394]/10" // BUTS Logo ka blue color
            strokeWidth={1.5}
          />
        </div>

        {/* Road/Speed Line Animation */}
        <div className="w-16 h-1 bg-gray-200 overflow-hidden rounded-full mt-[-4px]">
          <div className="h-full bg-[#e31e24] animate-infinite-scroll w-1/2 rounded-full"></div> 
          {/* #e31e24 is the red from your logo */}
        </div>
      </div>

      {/* Message with Pulse Effect */}
      {message && (
        <p className={`${textSizes[size]} mt-4 text-gray-700 font-bold tracking-wide animate-pulse`}>
          {message.toUpperCase()}
        </p>
      )}

      {/* Custom CSS for the road animation (Add this to your globals.css if needed) */}
      <style jsx>{`
        @keyframes infinite-scroll {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-infinite-scroll {
          animation: infinite-scroll 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
import React from 'react';

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M50 5L15 20V45C15 66.5 30 86.5 50 95C70 86.5 85 66.5 85 45V20L50 5Z" fill="#059669" />
        <path d="M50 15L25 26V45C25 60.5 35.5 75 50 81.5C64.5 75 75 60.5 75 45V26L50 15Z" fill="white" fillOpacity="0.2" />
        <circle cx="50" cy="45" r="12" fill="white" />
        <path d="M44 45H56M50 39V51" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
        <path d="M35 70C40 75 60 75 65 70" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      </svg>
    </div>
  );
}

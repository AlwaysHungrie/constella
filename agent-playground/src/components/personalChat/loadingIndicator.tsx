import React from 'react';

export default function LoadingIndicator() {
  return (
    <div className="inline-flex items-center">
      <div className="flex space-x-1.5">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`
              w-1.5 h-1.5
              bg-gray-500/50
              rounded-full
              animate-pulse
              duration-1000
            `}
            style={{
              animationDelay: `${index * 200}ms`
            }}
          />
        ))}
      </div>
    </div>
  );
}
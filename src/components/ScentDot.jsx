import React from 'react';

const ScentDot = ({ x, y, name, cluster, isSelected = false, onClick }) => {
  const clusterColors = {
    Fresh: 'bg-blue-400 hover:bg-blue-500',
    Sweet: 'bg-pink-400 hover:bg-pink-500',
    Spicy: 'bg-red-400 hover:bg-red-500',
    Woody: 'bg-amber-600 hover:bg-amber-700',
    Clean: 'bg-cyan-400 hover:bg-cyan-500',
  };

  const clusterBorders = {
    Fresh: 'border-blue-300',
    Sweet: 'border-pink-300',
    Spicy: 'border-red-300',
    Woody: 'border-amber-500',
    Clean: 'border-cyan-300',
  };

  return (
    <div
      className={`absolute w-3 h-3 rounded-full ${clusterColors[cluster] || 'bg-gray-400'} ${clusterBorders[cluster] || 'border-gray-300'} border-2 cursor-pointer transition-all duration-200 transform hover:scale-150 hover:z-50 ${
        isSelected ? 'ring-4 ring-white ring-opacity-50 scale-150 z-50' : ''
      }`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: isSelected ? 'translate(-50%, -50%) scale(1.5)' : 'translate(-50%, -50%)',
      }}
      onClick={onClick}
      title={name}
    >
      {isSelected && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {name}
        </div>
      )}
    </div>
  );
};

export default ScentDot;


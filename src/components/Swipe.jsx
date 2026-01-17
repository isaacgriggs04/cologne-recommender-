import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingChatButton from './FloatingChatButton';
import fragranceData from '../../fragrances_filtered.json';
import { useFragranceContext } from '../context/FragranceContext';

const SwipeCard = ({ fragrance, onSwipe, onCardClick }) => {
  const cardRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState(null);

  const handleLoveIt = (e) => {
    e.stopPropagation();
    animateAndSwipe('love');
  };
  const handleLikeIt = (e) => {
    e.stopPropagation();
    animateAndSwipe('like');
  };
  const handleMehIt = (e) => {
    e.stopPropagation();
    animateAndSwipe('meh');
  };
  const handleSkip = (e) => {
    e.stopPropagation();
    animateAndSwipe('skip');
  };

  const animateAndSwipe = (action) => {
    if (!cardRef.current) return;

    // Define exit animations based on direction
    const exitAnimations = {
      love: 'translateX(150%) rotate(20deg)',
      meh: 'translateX(-150%) rotate(-20deg)',
      like: 'translateY(-150%)',
      skip: 'translateY(150%)'
    };

    // Apply exit animation
    cardRef.current.style.transform = exitAnimations[action];
    cardRef.current.style.opacity = '0';
    cardRef.current.style.transition = 'all 0.3s ease';

    // After animation, trigger the swipe action
    setTimeout(() => {
      onSwipe(action);

      // Reset card position and styles
      if (cardRef.current) {
        cardRef.current.style.transform = '';
        cardRef.current.style.opacity = '1';
        cardRef.current.style.transition = '';
      }
    }, 300);
  };

  const handleDragStart = (e) => {
    e.preventDefault();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    setIsDragging(true);
    setHasDragged(false);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;

    e.preventDefault();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;

    // Mark as dragged if movement exceeds minimum threshold
    const dragThreshold = 10; // minimum pixels to consider it a drag
    if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
      setHasDragged(true);
    }

    setDragOffset({ x: deltaX, y: deltaY });

    // Determine swipe direction based on which axis has more movement
    const directionThreshold = 60; // minimum pixels to show direction hint and enable swipe

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > directionThreshold) {
        setSwipeDirection('love'); // Right
      } else if (deltaX < -directionThreshold) {
        setSwipeDirection('meh'); // Left
      } else {
        setSwipeDirection(null);
      }
    } else {
      // Vertical swipe
      if (deltaY < -directionThreshold) {
        setSwipeDirection('like'); // Up
      } else if (deltaY > directionThreshold) {
        setSwipeDirection('skip'); // Down
      } else {
        setSwipeDirection(null);
      }
    }
  };

  const handleDragEnd = (e) => {
    if (!isDragging) return;

    // Minimum distance threshold to trigger action (must drag AND release)
    const swipeThreshold = 80; // pixels needed to trigger action on release
    
    // Calculate final drag distance
    const finalDistanceX = Math.abs(dragOffset.x);
    const finalDistanceY = Math.abs(dragOffset.y);
    
    // Only trigger action if:
    // 1. User has dragged far enough (meets threshold)
    // 2. A swipe direction is active (indicator is showing)
    // 3. User releases the card (this function is only called on release)
    if (swipeDirection && (finalDistanceX > swipeThreshold || finalDistanceY > swipeThreshold)) {
      animateAndSwipe(swipeDirection);
    }

    // Reset drag state
    setIsDragging(false);
    setHasDragged(false);
    setDragStart({ x: 0, y: 0 });
    setDragOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
  };


  return (
    <div className="relative flex flex-col items-center space-y-2 w-full max-w-md mx-auto select-none h-full justify-center">
      {/* Direction indicators with glowing effects - show when dragging */}
      {isDragging && (
        <>
          {/* Love indicator (right) */}
          <div className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 transition-all duration-200 ${
            swipeDirection === 'love' ? 'opacity-100 scale-110' : 'opacity-40 scale-100'
          }`}>
            <div className="relative">
              <div className="absolute inset-0 bg-teal-400 rounded-full blur-lg opacity-60"></div>
              <div className="relative bg-teal-500/90 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full border-2 border-teal-300 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 sm:w-8 sm:h-8">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </div>
            </div>
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] sm:text-xs font-medium text-teal-300 whitespace-nowrap transition-opacity ${
              swipeDirection === 'love' ? 'opacity-100' : 'opacity-0'
            }`}>
              Love
            </div>
          </div>

          {/* Meh indicator (left) */}
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 transition-all duration-200 ${
            swipeDirection === 'meh' ? 'opacity-100 scale-110' : 'opacity-40 scale-100'
          }`}>
            <div className="relative">
              <div className="absolute inset-0 bg-orange-400 rounded-full blur-lg opacity-60"></div>
              <div className="relative bg-orange-500/90 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full border-2 border-orange-300 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6 sm:w-8 sm:h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] sm:text-xs font-medium text-orange-300 whitespace-nowrap transition-opacity ${
              swipeDirection === 'meh' ? 'opacity-100' : 'opacity-0'
            }`}>
              Meh
            </div>
          </div>

          {/* Like indicator (top) */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 z-10 transition-all duration-200 ${
            swipeDirection === 'like' ? 'opacity-100 scale-110' : 'opacity-40 scale-100'
          }`}>
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-60"></div>
              <div className="relative bg-green-500/90 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full border-2 border-green-300 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 sm:w-8 sm:h-8">
                  <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.45-.24zm-3.75 0a1.5 1.5 0 01-1.5-1.5v-6a1.5 1.5 0 011.5-1.5h2.25a.75.75 0 010 1.5H6v6h.75a.75.75 0 010 1.5h-3z" />
                </svg>
              </div>
            </div>
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[10px] sm:text-xs font-medium text-green-300 whitespace-nowrap transition-opacity ${
              swipeDirection === 'like' ? 'opacity-100' : 'opacity-0'
            }`}>
              Like
            </div>
          </div>

          {/* Skip indicator (bottom) */}
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-10 transition-all duration-200 ${
            swipeDirection === 'skip' ? 'opacity-100 scale-110' : 'opacity-40 scale-100'
          }`}>
            <div className="relative">
              <div className="absolute inset-0 bg-gray-400 rounded-full blur-lg opacity-60"></div>
              <div className="relative bg-gray-500/90 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full border-2 border-gray-300 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6 sm:w-8 sm:h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
                </svg>
              </div>
            </div>
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] sm:text-xs font-medium text-gray-300 whitespace-nowrap transition-opacity ${
              swipeDirection === 'skip' ? 'opacity-100' : 'opacity-0'
            }`}>
              Skip
            </div>
          </div>
        </>
      )}

      {/* Translucent Card Panel with Glowing Edges */}
      <div
        ref={cardRef}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        className="relative w-full flex-1 min-h-0"
        style={{
          transform: isDragging
            ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`
            : 'translate(0px, 0px) rotate(0deg)',
          transition: isDragging ? 'none' : 'transform 0.3s ease',
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isDragging ? 0.95 : 1,
          userSelect: 'none',
          touchAction: 'none'
        }}
      >
        {/* Light blue glow effect */}
        <div className="absolute -inset-1 bg-blue-500/20 rounded-2xl blur-md"></div>
        
        {/* Main translucent panel */}
        <div className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-4 md:p-6 shadow-2xl w-full h-full flex flex-col items-center mx-auto">
          {/* Centered Content */}
          <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 overflow-hidden">
            {/* Fragrance Image */}
            <div className="flex-1 w-full flex items-center justify-center relative mb-2 min-h-0">
              {fragrance["Image URL"] ? (
                <img
                  src={fragrance["Image URL"]}
                  alt={fragrance.Name}
                  className="max-h-full max-w-full w-auto object-contain pointer-events-none rounded-lg drop-shadow-2xl"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full max-h-[200px] flex items-center justify-center bg-gray-800/50 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                </div>
              )}
            </div>

            {/* Fragrance Info Text */}
            <div className="text-center space-y-0.5 px-2 flex-none w-full">
              <h3 className="text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider truncate w-full">{fragrance.Brand}</h3>
              <h2 className="text-white text-base sm:text-xl font-bold line-clamp-1 leading-tight">{fragrance.Name}</h2>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                {fragrance.OilType && (
                  <span className="px-1.5 py-0.5 rounded-full bg-gray-800/80 border border-gray-700 text-[8px] sm:text-[10px] text-gray-300">
                    {fragrance.OilType}
                  </span>
                )}
                {fragrance.Gender && (
                  <span className="px-1.5 py-0.5 rounded-full bg-gray-800/80 border border-gray-700 text-[8px] sm:text-[10px] text-gray-300 uppercase tracking-wide">
                    {fragrance.Gender}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Fallback buttons - Integrated inside card for mobile, customized layout */}
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 flex-none">
            <button
              onClick={handleMehIt}
              className="md:col-span-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 py-2.5 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-1.5 backdrop-blur-sm"
            >
              <span className="text-base">✕</span>
              <span className="text-xs">Meh</span>
            </button>
            <button
              onClick={handleLikeIt}
              className="md:col-span-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 py-2.5 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-1.5 backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.45-.24zm-3.75 0a1.5 1.5 0 01-1.5-1.5v-6a1.5 1.5 0 011.5-1.5h2.25a.75.75 0 010 1.5H6v6h.75a.75.75 0 010 1.5h-3z" />
              </svg>
              <span className="text-xs">Like</span>
            </button>
            <button
              onClick={handleLoveIt}
              className="md:col-span-1 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 py-2.5 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-1.5 backdrop-blur-sm"
            >
              <span className="text-base">♥</span>
              <span className="text-xs">Love</span>
            </button>
            <button
              onClick={handleSkip}
              className="md:col-span-1 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/30 text-gray-400 py-2.5 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-1.5 backdrop-blur-sm"
            >
              <span className="text-base">↓</span>
              <span className="text-xs">Skip</span>
            </button>
          </div>

          {/* View Details Button - Positioned absolutely or integrated */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCardClick();
            }}
            className="mt-2 w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            View Details
          </button>
        </div>
      </div>

      {/* Fallback buttons - removed from here as they are now inside the card */}
    </div>
  );
};

const ResultsView = ({ categorizedFragrances, onBack }) => {
  const categories = [
    { key: 'love', label: 'Love It', color: 'bg-green-700' },
    { key: 'like', label: 'Like It', color: 'bg-green-400' },
    { key: 'meh', label: 'Meh', color: 'bg-orange-500' },
    { key: 'skip', label: 'Skip', color: 'bg-gray-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-serif italic text-gray-900">Results</h1>
        <button
          onClick={onBack}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Back to Swipe
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((category) => (
          <div key={category.key} className="bg-white rounded-2xl shadow-lg p-6">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium mb-4 ${category.color}`}>
              {category.label}
            </div>
            <div className="space-y-3">
              {categorizedFragrances[category.key].length === 0 ? (
                <p className="text-gray-500 text-sm">No fragrances in this category yet.</p>
              ) : (
                categorizedFragrances[category.key].map((fragrance, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                      {fragrance["Image URL"] ? (
                        <img
                          src={fragrance["Image URL"]}
                          alt={fragrance.Name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">{fragrance.Name}</h4>
                      <p className="text-xs text-gray-500 truncate">{fragrance.Brand}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Swipe = () => {
  const navigate = useNavigate();
  const { setRecommendations, setSwipeHistoryUsed } = useFragranceContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [view, setView] = useState('swipe'); // 'swipe' or 'results'
  const [swipeHistory, setSwipeHistory] = useState([]);
  const [categorizedFragrances, setCategorizedFragrances] = useState({
    love: [],
    like: [],
    meh: [],
    skip: []
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedGenders, setSelectedGenders] = useState(['men', 'women', 'unisex']); // Default to all
  const [shuffledFragrances, setShuffledFragrances] = useState([]);

  // Shuffle array function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Filter fragrances based on selected genders
  const filteredFragrances = fragranceData.filter(fragrance =>
    selectedGenders.includes(fragrance.Gender?.toLowerCase())
  );

  // Update shuffled fragrances when filters change
  useEffect(() => {
    setShuffledFragrances(shuffleArray(filteredFragrances));
    setCurrentIndex(0); // Reset to first fragrance when filters change
    // Clear saved progress when filters change
    localStorage.removeItem('swipeProgress');
    setSwipeHistory([]);
    setCategorizedFragrances({
      love: [],
      like: [],
      meh: [],
      skip: []
    });
  }, [selectedGenders]);

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('swipeProgress');
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);

        // Validate and sanitize loaded data
        const validIndex = Math.max(0, Math.min(progress.currentIndex || 0, shuffledFragrances.length));
        const validSwipeHistory = (progress.swipeHistory || []).filter(item =>
          item && item.fragrance && typeof item.action === 'string'
        );
        const validCategorizedFragrances = progress.categorizedFragrances || {
          love: [],
          like: [],
          meh: [],
          skip: []
        };

        // Ensure categorized fragrances arrays exist
        Object.keys(validCategorizedFragrances).forEach(key => {
          if (!Array.isArray(validCategorizedFragrances[key])) {
            validCategorizedFragrances[key] = [];
          }
        });

        setCurrentIndex(validIndex);
        setSwipeHistory(validSwipeHistory);
        setCategorizedFragrances(validCategorizedFragrances);

        console.log('Loaded swipe progress:', {
          index: validIndex,
          historyLength: validSwipeHistory.length,
          totalSwipes: Object.values(validCategorizedFragrances).reduce((sum, arr) => sum + arr.length, 0)
        });

      } catch (error) {
        console.error('Error loading swipe progress:', error);
        // Clear corrupted data
        localStorage.removeItem('swipeProgress');
      }
    }
    setIsLoaded(true);
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      const progress = {
        currentIndex,
        swipeHistory,
        categorizedFragrances,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('swipeProgress', JSON.stringify(progress));
    }
  }, [currentIndex, swipeHistory, categorizedFragrances, isLoaded]);

  // Function to reset/clear progress
  const resetProgress = () => {
    setCurrentIndex(0);
    setSwipeHistory([]);
    setCategorizedFragrances({
      love: [],
      like: [],
      meh: [],
      skip: []
    });
    setRecommendations(null);
    setSwipeHistoryUsed([]);
    localStorage.removeItem('swipeProgress');
  };

  // Calculate stats
  const totalSwipes = swipeHistory.length + categorizedFragrances.skip.length;
  const stats = {
    meh: categorizedFragrances.meh.length,
    liked: categorizedFragrances.like.length,
    loved: categorizedFragrances.love.length,
    skipped: categorizedFragrances.skip.length,
    total: totalSwipes
  };

  const handleSwipe = (action) => {
    const currentFragrance = shuffledFragrances[currentIndex];
    if (currentFragrance) {
      const swipeEntry = {
        fragrance: currentFragrance,
        action: action,
        timestamp: new Date().toISOString()
      };

      // Only record non-skip actions in swipeHistory
      if (action !== 'skip') {
        setSwipeHistory(prev => [...prev, swipeEntry]);
      }

      setCategorizedFragrances(prev => ({
        ...prev,
        [action]: [...prev[action], currentFragrance]
      }));

      console.log(`Categorized ${currentFragrance.Name} as "${action}"`);
    }

    // Move to next fragrance (don't loop, stop at end)
    const nextIndex = currentIndex + 1;
    if (nextIndex < shuffledFragrances.length) {
      setCurrentIndex(nextIndex);
    } else {
      // User has completed all fragrances
      setCurrentIndex(shuffledFragrances.length); // Set to length to indicate completion
    }
  };

  const handleCardClick = () => {
    const currentFragrance = shuffledFragrances[currentIndex];
    if (currentFragrance) {
      // Find the original index in fragranceData for navigation
      const originalIndex = fragranceData.findIndex(f => f === currentFragrance);
      // Store scroll position and navigate to fragrance details with from=swipe
      const scrollY = window.scrollY || window.pageYOffset;
      sessionStorage.setItem('scrollPosition', scrollY.toString());
      navigate(`/fragrance/${originalIndex + 1}?from=swipe`);
    }
  };

  const handleBackToSwipe = () => {
    setView('swipe');
  };

  const currentFragrance = shuffledFragrances[currentIndex];

  // Show loading state if fragrances haven't loaded yet
  if (!shuffledFragrances) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-20 pb-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading fragrances...</p>
          </div>
        </div>
        <FloatingChatButton />
      </div>
    );
  }

  if (view === 'results') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] pt-20 pb-8 px-4 md:px-8">
        <ResultsView categorizedFragrances={categorizedFragrances} onBack={handleBackToSwipe} />
        <FloatingChatButton />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 pt-2 pb-0 px-2 md:px-8 overflow-hidden flex flex-col touch-none">
      <div className="max-w-md md:max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-1 flex-none px-1 relative z-20">
          <div>
            <h1 className="text-xl md:text-3xl font-serif italic text-white/90">Swipe</h1>
            {(swipeHistory.length > 0 || currentIndex > 0) && (
              <p className="text-[10px] md:text-xs text-gray-500">Auto-saved</p>
            )}
          </div>
          <div className="flex gap-2">
            {(swipeHistory.length > 0 || currentIndex > 0) && (
              <button
                onClick={resetProgress}
                className="bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-full font-medium transition-colors text-xs backdrop-blur-sm"
                title="Reset all progress"
              >
                Reset
              </button>
            )}
            {swipeHistory.length > 0 && (
              <button
                onClick={() => navigate('/swipe-results', { state: { swipeHistory } })}
                className="bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 text-white px-3 py-1.5 rounded-full font-medium transition-colors backdrop-blur-sm shadow-lg text-xs"
              >
                Results ({swipeHistory.length})
              </button>
            )}
          </div>
        </div>

        {/* Gender Filter */}
        <div className="mb-2 flex-none relative z-20">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-full p-1 max-w-sm mx-auto">
            <div className="flex justify-between gap-1 items-center px-1">
              {[
                { value: 'men', label: 'Men', color: 'blue' },
                { value: 'women', label: 'Women', color: 'pink' },
                { value: 'unisex', label: 'Unisex', color: 'purple' }
              ].map((gender) => (
                <label key={gender.value} className="flex-1 flex items-center justify-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedGenders.includes(gender.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGenders(prev => [...prev, gender.value]);
                      } else {
                        // Prevent unchecking if it's the last selected gender
                        if (selectedGenders.length > 1) {
                          setSelectedGenders(prev => prev.filter(g => g !== gender.value));
                        }
                      }
                    }}
                    className="sr-only"
                  />
                  <div className={`px-2 md:px-3 py-1.5 rounded-full text-[10px] md:text-xs font-medium transition-all duration-200 w-full text-center border ${
                    selectedGenders.includes(gender.value)
                      ? `bg-${gender.color}-500/20 text-${gender.color}-300 border-${gender.color}-500/50 shadow-[0_0_10px_rgba(var(--${gender.color}-500-rgb),0.2)]`
                      : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-700/30'
                  }`}>
                    {gender.label}
                  </div>
                </label>
              ))}
              <span className="text-[10px] text-gray-600 ml-1 border-l border-gray-700/50 pl-2 whitespace-nowrap min-w-[3ch] text-center">
                {shuffledFragrances.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center min-h-0 relative pb-2 items-center">
        {currentIndex >= shuffledFragrances.length ? (
          // Completion state
          <div className="text-center py-8">
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
              <div className="text-green-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-serif italic text-white mb-4">All Done!</h2>
              <p className="text-gray-300 mb-6">
                You've swiped through all {shuffledFragrances.length} fragrances.
                {swipeHistory.length > 0 && ` You made ${swipeHistory.length} meaningful choices!`}
              </p>
              <div className="flex gap-3 justify-center">
                {swipeHistory.length > 0 && (
                  <button
                    onClick={() => navigate('/swipe-results', { state: { swipeHistory } })}
                    className="bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 text-white px-6 py-2 rounded-lg font-medium transition-colors backdrop-blur-sm"
                  >
                    See My Results
                  </button>
                )}
                <button
                  onClick={resetProgress}
                  className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors backdrop-blur-sm"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        ) : currentFragrance ? (
          <div className="flex flex-col items-center h-full justify-center w-full max-w-[85%] sm:max-w-sm md:max-w-md mx-auto">
            <div className="flex-1 w-full flex flex-col justify-center min-h-0 py-8 md:py-12">
              <SwipeCard fragrance={currentFragrance} onSwipe={handleSwipe} onCardClick={handleCardClick} />
            </div>

            {/* Stats Display - moved below card */}
            <div className="grid grid-cols-4 gap-2 w-full flex-none mt-2 px-1">
              <div className="bg-gray-800/30 backdrop-blur-sm border border-orange-500/10 rounded-lg p-1 text-center">
                <div className="text-xs md:text-sm font-bold text-orange-400 leading-none">{stats.meh}</div>
                <div className="text-[8px] md:text-[9px] text-gray-500 uppercase tracking-wide">Meh</div>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm border border-green-500/10 rounded-lg p-1 text-center">
                <div className="text-xs md:text-sm font-bold text-green-400 leading-none">{stats.liked}</div>
                <div className="text-[8px] md:text-[9px] text-gray-500 uppercase tracking-wide">Liked</div>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm border border-teal-500/10 rounded-lg p-1 text-center">
                <div className="text-xs md:text-sm font-bold text-teal-400 leading-none">{stats.loved}</div>
                <div className="text-[8px] md:text-[9px] text-gray-500 uppercase tracking-wide">Loved</div>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-500/10 rounded-lg p-1 text-center">
                <div className="text-xs md:text-sm font-bold text-gray-500 leading-none">{stats.skipped}</div>
                <div className="text-[8px] md:text-[9px] text-gray-600 uppercase tracking-wide">Skip</div>
              </div>
            </div>
          </div>
        ) : (
          // Loading state
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading fragrances...</p>
          </div>
        )}
        </div>
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default Swipe;

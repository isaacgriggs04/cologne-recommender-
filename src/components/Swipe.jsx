import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingChatButton from './FloatingChatButton';
import fragranceData from '../../fragrances_filtered.json';

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
    <div className="relative flex flex-col items-center space-y-8 w-full max-w-md mx-auto select-none">
      {/* Direction indicators with glowing effects - show when dragging */}
      {isDragging && (
        <>
          {/* Love indicator (right) */}
          <div className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 transition-all duration-200 ${
            swipeDirection === 'love' ? 'opacity-100 scale-110' : 'opacity-40 scale-100'
          }`}>
            <div className="relative">
              <div className="absolute inset-0 bg-teal-400 rounded-full blur-lg opacity-60"></div>
              <div className="relative bg-teal-500/90 backdrop-blur-sm text-white p-3 rounded-full border-2 border-teal-300 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </div>
            </div>
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs font-medium text-teal-300 whitespace-nowrap transition-opacity ${
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
              <div className="relative bg-orange-500/90 backdrop-blur-sm text-white p-3 rounded-full border-2 border-orange-300 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs font-medium text-orange-300 whitespace-nowrap transition-opacity ${
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
              <div className="relative bg-green-500/90 backdrop-blur-sm text-white p-3 rounded-full border-2 border-green-300 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                  <path d="M7.493 19.5l-.01-.004a4.5 4.5 0 01-.02-8.542 4.5 4.5 0 018.03 3.748l1.303 3.938a3.75 3.75 0 01-3.659 4.805h-.243a2.25 2.25 0 01-2.015-1.5l-1.67-4.24zm11.29-.006l-.01.004a4.5 4.5 0 01-.02-8.542 4.5 4.5 0 018.03 3.748l1.303 3.938a3.75 3.75 0 01-3.659 4.805h-.243a2.25 2.25 0 01-2.015-1.5l-1.67-4.24z" />
                </svg>
              </div>
            </div>
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 text-xs font-medium text-green-300 whitespace-nowrap transition-opacity ${
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
              <div className="relative bg-gray-500/90 backdrop-blur-sm text-white p-3 rounded-full border-2 border-gray-300 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
                </svg>
              </div>
            </div>
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs font-medium text-gray-300 whitespace-nowrap transition-opacity ${
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
        className="relative"
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
        {/* Glowing border effect */}
        <div className="absolute -inset-1 bg-blue-300 rounded-2xl opacity-70 blur-sm"></div>
        <div className="absolute -inset-0.5 bg-blue-400 rounded-2xl opacity-50 blur"></div>
        
        {/* Main translucent panel */}
        <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl min-h-[400px] flex flex-col items-center">
          {/* Centered Content */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Fragrance Image */}
            <div className="w-48 h-64 mb-6 flex items-center justify-center">
              {fragrance["Image URL"] ? (
                <img
                  src={fragrance["Image URL"]}
                  alt={fragrance.Name}
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800/50 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                </div>
              )}
            </div>

            {/* Fragrance Info Text */}
            <div className="text-center space-y-2">
              <h3 className="text-white text-2xl font-semibold">{fragrance.Brand}</h3>
              <h2 className="text-white text-3xl font-bold">{fragrance.Name}</h2>
              {fragrance.OilType && (
                <p className="text-gray-300 text-sm">{fragrance.OilType}</p>
              )}
              {fragrance.Gender && (
                <p className="text-gray-400 text-xs uppercase tracking-wider">{fragrance.Gender}</p>
              )}
            </div>
          </div>

          {/* View Details Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCardClick();
            }}
            className="relative group mt-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 text-blue-300 px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-200 backdrop-blur-sm flex items-center gap-2 hover:scale-105"
          >
            <div className="absolute inset-0 bg-blue-400/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 relative z-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <span className="relative z-10">View Details</span>
          </button>
        </div>
      </div>

      {/* Fallback buttons - minimal, below card */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        <button
          onClick={handleMehIt}
          className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-300 px-3 py-2 rounded-lg font-medium shadow-lg transition-all duration-200 text-xs whitespace-nowrap backdrop-blur-sm"
        >
          ✕ Meh
        </button>
        <button
          onClick={handleLikeIt}
          className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 px-3 py-2 rounded-lg font-medium shadow-lg transition-all duration-200 text-xs whitespace-nowrap backdrop-blur-sm"
        >
          ↑ Like
        </button>
        <button
          onClick={handleLoveIt}
          className="bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 px-3 py-2 rounded-lg font-medium shadow-lg transition-all duration-200 text-xs whitespace-nowrap backdrop-blur-sm"
        >
          ♥ Love
        </button>
        <button
          onClick={handleSkip}
          className="bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/50 text-gray-300 px-3 py-2 rounded-lg font-medium shadow-lg transition-all duration-200 text-xs whitespace-nowrap backdrop-blur-sm"
        >
          ↓ Skip
        </button>
      </div>
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
  const [selectedGenders, setSelectedGenders] = useState(['men', 'women', 'unisex']); // Default to all genders selected
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

  // Filter fragrances based on selected genders and shuffle them
  const filteredFragrances = fragranceData.filter(fragrance =>
    selectedGenders.includes(fragrance.Gender?.toLowerCase())
  );

  // Update shuffled fragrances when filters change
  useEffect(() => {
    setShuffledFragrances(shuffleArray(filteredFragrances));
    setCurrentIndex(0); // Reset to first fragrance when filters change
    // Clear saved progress when filters change since the order is now randomized
    localStorage.removeItem('swipeProgress');
    setSwipeHistory([]);
    setCategorizedFragrances({
      love: [],
      like: [],
      meh: [],
      skip: []
    });
  }, [selectedGenders]);

  // Initialize shuffled fragrances on first load
  useEffect(() => {
    setShuffledFragrances(shuffleArray(filteredFragrances));
  }, []); // Run once on component mount

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
    localStorage.removeItem('swipeProgress');
  };

  // Calculate stats
  const totalSwipes = swipeHistory.length + categorizedFragrances.skip.length;
  const stats = {
    meh: categorizedFragrances.meh.length,
    liked: categorizedFragrances.like.length,
    loved: categorizedFragrances.love.length,
    skipped: categorizedFragrances.skip.length,
    total: totalSwipes,
    progress: currentIndex >= shuffledFragrances.length ? 'Completed!' : `${currentIndex + 1} of ${shuffledFragrances.length}`
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

  const handleShowResults = () => {
    setView('results');
  };

  const handleBackToSwipe = () => {
    setView('swipe');
  };

  const currentFragrance = shuffledFragrances[currentIndex];

  if (view === 'results') {
    return (
      <div className="swipe-container">
        <div className="swipe-desktop-scale min-h-screen bg-[#F8F9FA] pt-20 pb-8 px-4 md:px-8">
          <ResultsView categorizedFragrances={categorizedFragrances} onBack={handleBackToSwipe} />
          <FloatingChatButton />
        </div>
      </div>
    );
  }

  return (
    <div className="swipe-container">
      <div className="swipe-desktop-scale min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-20 pb-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif italic text-white">Swipe</h1>
            {(swipeHistory.length > 0 || currentIndex > 0) && (
              <p className="text-sm text-gray-400 mt-1">Progress saved automatically</p>
            )}
          </div>
          <div className="flex gap-3">
            {(swipeHistory.length > 0 || currentIndex > 0) && (
              <button
                onClick={resetProgress}
                className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm backdrop-blur-sm"
                title="Reset all progress and start from beginning"
              >
                Reset Progress
              </button>
            )}
            {swipeHistory.length > 0 && (
              <button
                onClick={() => navigate('/swipe-results', { state: { swipeHistory } })}
                className="bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 text-white px-6 py-2 rounded-lg font-medium transition-colors backdrop-blur-sm shadow-lg"
              >
                See My Results ({swipeHistory.length})
              </button>
            )}
          </div>
        </div>

        {/* Gender Filter */}
        <div className="mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 max-w-md mx-auto">
            <h3 className="text-white text-sm font-medium mb-3 text-center">Filter by Gender</h3>
            <div className="flex justify-center gap-4">
              {[
                { value: 'men', label: 'Male', color: 'blue' },
                { value: 'women', label: 'Female', color: 'pink' },
                { value: 'unisex', label: 'Unisex', color: 'purple' }
              ].map((gender) => (
                <label key={gender.value} className="flex items-center cursor-pointer group">
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
                      // Reset current index when filter changes to avoid out of bounds
                      setCurrentIndex(0);
                    }}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 border-2 rounded-md mr-2 transition-all duration-200 ${
                    selectedGenders.includes(gender.value)
                      ? `bg-${gender.color}-500 border-${gender.color}-400 shadow-lg shadow-${gender.color}-500/25`
                      : 'bg-gray-700 border-gray-600 group-hover:border-gray-500'
                  }`}>
                    {selectedGenders.includes(gender.value) && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${
                    selectedGenders.includes(gender.value) ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                  }`}>
                    {gender.label}
                  </span>
                </label>
              ))}
            </div>
            <div className="text-center mt-2">
              <span className="text-xs text-gray-500">
                {shuffledFragrances.length} fragrance{shuffledFragrances.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          </div>
        </div>

        {currentIndex >= shuffledFragrances.length ? (
          // Completion state
          <div className="text-center py-16">
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
          <div className="flex flex-col items-center space-y-8">
            <SwipeCard fragrance={currentFragrance} onSwipe={handleSwipe} onCardClick={handleCardClick} />

            {/* Stats Display - moved below card to avoid blocking upward swipes */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full max-w-md">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-orange-500/30 rounded-lg p-3 text-center shadow-lg">
                <div className="text-xl font-bold text-orange-400">{stats.meh}</div>
                <div className="text-xs text-gray-400">Meh</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-green-500/30 rounded-lg p-3 text-center shadow-lg">
                <div className="text-xl font-bold text-green-400">{stats.liked}</div>
                <div className="text-xs text-gray-400">Liked</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-teal-500/30 rounded-lg p-3 text-center shadow-lg">
                <div className="text-xl font-bold text-teal-400">{stats.loved}</div>
                <div className="text-xs text-gray-400">Loved</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-500/30 rounded-lg p-3 text-center shadow-lg">
                <div className="text-xl font-bold text-gray-400">{stats.skipped}</div>
                <div className="text-xs text-gray-400">Skipped</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-500/30 rounded-lg p-3 text-center shadow-lg md:col-span-1 col-span-2">
                <div className="text-sm font-bold text-blue-300">{stats.progress}</div>
                <div className="text-xs text-gray-400">Progress</div>
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
        <FloatingChatButton />
      </div>
    </div>
  );
};

export default Swipe;

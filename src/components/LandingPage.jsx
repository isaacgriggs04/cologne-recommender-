import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FloatingChatButton from './FloatingChatButton';
import fragranceData from '../../fragrances_filtered.json';

const DiscoveryCard = ({ fragrance, onClick }) => (
  <div
    onClick={onClick}
    className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-xl p-3 sm:p-4 cursor-pointer group hover:border-blue-500/50 hover:scale-[1.02] sm:hover:scale-105 hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-500 ease-out transform overflow-hidden relative flex flex-col h-full min-h-[320px] sm:aspect-[3/4]"
  >
    {/* Glowing border effect on hover */}
    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-purple-500/0 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500"></div>
    
    {/* Name at top */}
    <div className="relative mb-2 sm:mb-3">
      <h3 className="text-base sm:text-lg font-medium text-white line-clamp-2 group-hover:text-blue-300 transition-colors text-center">{fragrance.Name}</h3>
      {fragrance.Brand && (
        <p className="text-xs sm:text-sm text-gray-400 text-center mt-0.5 sm:mt-1">{fragrance.Brand}</p>
      )}
    </div>

    {/* Image in the middle */}
    <div className="relative flex-1 flex items-center justify-center my-2 sm:my-3 min-h-0">
      <div className="relative w-full h-full max-h-[160px] sm:max-h-none rounded-xl bg-gray-700/50 flex items-center justify-center overflow-hidden border border-gray-600/50 group-hover:border-blue-500/50 transition-colors">
        {fragrance["Image URL"] ? (
          <img src={fragrance["Image URL"]} alt={fragrance.Name} className="w-full h-full object-contain p-2" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        )}
      </div>
    </div>

    {/* Notes at bottom */}
    <div className="relative flex gap-1.5 sm:gap-2 flex-wrap justify-center mt-auto">
      {(fragrance["General Notes"] || []).slice(0, 3).map((note, index) => (
        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-gray-700/50 text-gray-300 border border-gray-600/50">
          {note}
        </span>
      ))}
    </div>
  </div>
);

// Filter Dropdown Component
const FilterDropdown = ({ label, options, value, onChange, placeholder = "All" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex-1 sm:flex-none min-w-[120px] sm:min-w-[140px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-gray-800/60 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs sm:text-sm font-medium hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-colors ${
          value ? 'border-blue-500/50 bg-blue-500/20 text-blue-300' : 'border-gray-700/50 text-gray-300'
        }`}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 sm:right-auto mt-1 bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-lg shadow-2xl z-[60] sm:min-w-[200px] max-h-60 overflow-y-auto">
            <div className="py-1">
              <button
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 focus:bg-gray-700/50 focus:outline-none transition-colors"
              >
                All {label}
              </button>
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 focus:bg-gray-700/50 focus:outline-none transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const LandingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Filter states
  const [genderFilter, setGenderFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [oilTypeFilter, setOilTypeFilter] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Restore scroll position when returning to this page
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('scrollPosition');

    if (savedPosition) {
      // Small delay to ensure content is rendered before scrolling
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedPosition, 10),
          behavior: 'instant'
        });

        // Clear the saved position after restoring
        sessionStorage.removeItem('scrollPosition');
      }, 100);
    }
  }, [location.pathname]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const genders = new Set();
    const brands = new Set();
    const oilTypes = new Set();

    fragranceData.forEach(f => {
      if (f.Gender) genders.add(f.Gender.toLowerCase());
      if (f.Brand) brands.add(f.Brand);
      if (f.OilType) oilTypes.add(f.OilType);
    });

    return {
      genders: Array.from(genders).sort(),
      brands: Array.from(brands).sort(),
      oilTypes: Array.from(oilTypes).sort()
    };
  }, []);

  // Apply filters to fragrance data
  const filteredFragrances = useMemo(() => {
    let filtered = fragranceData;

    if (genderFilter) {
      filtered = filtered.filter(f =>
        (f.Gender || '').toLowerCase() === genderFilter.toLowerCase()
      );
    }

    if (brandFilter) {
      filtered = filtered.filter(f => f.Brand === brandFilter);
    }

    if (oilTypeFilter) {
      filtered = filtered.filter(f => f.OilType === oilTypeFilter);
    }

    return filtered;
  }, [genderFilter, brandFilter, oilTypeFilter]);

  // Clear all filters
  const clearFilters = () => {
    setGenderFilter('');
    setBrandFilter('');
    setOilTypeFilter('');
  };

  // Check if any filters are active
  const hasActiveFilters = genderFilter || brandFilter || oilTypeFilter;

  // Handle search input changes
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length > 0) {
      const searchTerms = term.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      
      const suggestions = filteredFragrances
        .filter(f => {
          const name = (f.Name || '').toLowerCase();
          const brand = (f.Brand || '').toLowerCase();
          const combined = `${name} ${brand}`;

          // All search terms must match somewhere in name or brand
          return searchTerms.every(searchTerm =>
            name.includes(searchTerm) || brand.includes(searchTerm) || combined.includes(searchTerm)
          );
        })
        .slice(0, 5); // Limit to 5 suggestions
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && searchSuggestions[selectedIndex]) {
        // Navigate to selected suggestion
        const fragrance = searchSuggestions[selectedIndex];
        const index = fragranceData.indexOf(fragrance);
        const scrollY = document.documentElement.scrollTop || document.body.scrollTop || window.pageYOffset;
        console.log('Saving scroll position from keyboard:', scrollY);
        sessionStorage.setItem('scrollPosition', scrollY.toString());

        setTimeout(() => {
          navigate(`/fragrance/${index + 1}`);
          setShowSuggestions(false);
          setSearchTerm('');
        }, 0);
      } else if (searchTerm.trim()) {
        // Navigate to search results page
        navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
        setShowSuggestions(false);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < searchSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (fragrance) => {
    const index = fragranceData.indexOf(fragrance);
    const scrollY = document.documentElement.scrollTop || document.body.scrollTop || window.pageYOffset;
    console.log('Saving scroll position from suggestion:', scrollY); // Debug log
    sessionStorage.setItem('scrollPosition', scrollY.toString());

    setTimeout(() => {
      navigate(`/fragrance/${index + 1}`);
      setShowSuggestions(false);
      setSearchTerm('');
    }, 0);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-24 sm:pt-28 pb-8 px-4 md:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-serif italic text-white mb-1 sm:mb-2">Discover</h1>
            <p className="text-base sm:text-lg text-gray-400 font-light">Explore our curated collection of fine fragrances.</p>
            {hasActiveFilters && (
              <p className="text-sm text-blue-400 font-medium mt-1">
                Showing {filteredFragrances.length} fragrances
              </p>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 sm:gap-3">
            <FilterDropdown
              label="Gender"
              options={filterOptions.genders}
              value={genderFilter}
              onChange={setGenderFilter}
              placeholder="All Genders"
            />
            <FilterDropdown
              label="Brand"
              options={filterOptions.brands}
              value={brandFilter}
              onChange={setBrandFilter}
              placeholder="All Brands"
            />
            <FilterDropdown
              label="Type"
              options={filterOptions.oilTypes}
              value={oilTypeFilter}
              onChange={setOilTypeFilter}
              placeholder="All Types"
            />
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs sm:text-sm font-medium text-orange-300 hover:text-orange-200 bg-orange-500/20 hover:bg-orange-500/30 px-3 py-2 sm:px-4 sm:py-2 rounded-lg border border-orange-500/50 transition-all whitespace-nowrap backdrop-blur-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="relative w-full md:w-96 mx-auto md:mx-0">
          <input
            type="text"
            placeholder="Search fragrances..."
            className="w-full px-5 py-2.5 sm:px-6 sm:py-3 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-full shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all pl-10 sm:pl-12 text-sm sm:text-base text-white placeholder-gray-400"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay to allow click events on suggestions
              setTimeout(() => setShowSuggestions(false), 200);
            }}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-gray-400 absolute left-4 top-3.5 pointer-events-none"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>

          {/* Autofill Suggestions Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden z-50 max-h-80 overflow-y-auto">
              {searchSuggestions.map((fragrance, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(fragrance)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-700/50 transition-colors text-left ${
                    selectedIndex === index ? 'bg-gray-700/50' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-700/50 flex-shrink-0 overflow-hidden border border-gray-600/50">
                    {fragrance['Image URL'] ? (
                      <img src={fragrance['Image URL']} alt={fragrance.Name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm truncate">{fragrance.Name}</h4>
                    <p className="text-xs text-gray-400 truncate">{fragrance.Brand}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Discovery Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        {filteredFragrances.map((fragrance, index) => (
          <DiscoveryCard
            key={`${fragrance.Name}-${fragrance.Brand}-${index}`}
            fragrance={fragrance}
            onClick={() => {
              // Get scroll position synchronously at click time
              const scrollY = document.documentElement.scrollTop || document.body.scrollTop || window.pageYOffset;
              console.log('Saving scroll position:', scrollY, 'window.scrollY:', window.scrollY); // Debug both methods
              sessionStorage.setItem('scrollPosition', scrollY.toString());

              // Find the original index in fragranceData for navigation
              const originalIndex = fragranceData.indexOf(fragrance);

              // Small delay before navigation to ensure save happens
              setTimeout(() => {
                navigate(`/fragrance/${originalIndex + 1}`);
              }, 0);
            }}
          />
        ))}
      </div>

      <FloatingChatButton />
    </div>
  );
};

export default LandingPage;

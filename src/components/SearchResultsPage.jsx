import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import fragranceData from '../../fragrances_filtered.json';
import FloatingChatButton from './FloatingChatButton';
import { useFragranceContext } from '../context/FragranceContext';

// Filter Dropdown Component
const FilterDropdown = ({ label, options, value, onChange, placeholder = "All" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-gray-800/60 backdrop-blur-sm border rounded-lg px-3 py-2 text-sm font-medium hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors min-w-[140px] ${
          value ? 'border-blue-500/50 bg-blue-500/20 text-blue-300' : 'border-gray-700/50 text-gray-300'
        }`}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
          <div className="absolute top-full mt-1 bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-lg shadow-2xl z-20 min-w-[200px] max-h-60 overflow-y-auto">
            <div className="py-1">
              <button
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 focus:bg-gray-700/50 focus:outline-none"
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
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 focus:bg-gray-700/50 focus:outline-none"
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

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';

  // Filter states
  const [genderFilter, setGenderFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [oilTypeFilter, setOilTypeFilter] = useState('');

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

  // Clear all filters
  const clearFilters = () => {
    setGenderFilter('');
    setBrandFilter('');
    setOilTypeFilter('');
  };

  // Check if any filters are active
  const hasActiveFilters = genderFilter || brandFilter || oilTypeFilter;

  const SearchResultCard = ({ fragrance, onClick }) => {
    const { addFragrance } = useFragranceContext();

    const handleWishlistClick = (e) => {
      e.stopPropagation();
      addFragrance({
        id: Date.now(),
        name: fragrance.Name,
        brand: fragrance.Brand,
        notes: fragrance['General Notes'] || [],
        accords: fragrance['Main Accords'] || [],
        accordsPercentage: fragrance['Main Accords Percentage'] || {},
        image: fragrance['Image URL'],
        listType: 'wishlist',
        fragranceData: fragrance
      });
    };

  return (
    <div
      onClick={onClick}
      className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-xl p-8 cursor-pointer group hover:border-blue-500/50 hover:scale-105 hover:-translate-y-2 transition-all duration-500 ease-out transform flex flex-col md:flex-row gap-8 items-center relative overflow-hidden"
    >
      {/* Glowing border effect on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-purple-500/0 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500"></div>
      
      <button
        onClick={handleWishlistClick}
        className="absolute top-4 right-4 z-20 bg-blue-600/80 backdrop-blur-sm border border-blue-500/50 text-white px-3 py-2 rounded-full text-sm font-medium hover:bg-blue-600 hover:scale-110 transition-all duration-300 shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
        title="Add to Wishlist"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-2xl bg-gray-900/50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-700/50 group-hover:border-blue-500/50 transition-colors">
          {fragrance["Image URL"] ? (
            <img src={fragrance["Image URL"]} alt={fragrance.Name} className="w-full h-full object-contain p-4" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          )}
        </div>

        <div className="relative flex-1 text-center md:text-left">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">{fragrance.Brand}</h2>
          <h3 className="text-3xl font-serif italic text-white mb-4 group-hover:text-blue-300 transition-colors">{fragrance.Name}</h3>

          <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
            {(fragrance["General Notes"] || []).slice(0, 6).map((note, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-700/50 text-gray-300 border border-gray-600/50">
                {note}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-6 justify-center md:justify-start text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <span className="text-yellow-400">★</span> {fragrance.rating}/5
            </span>
            <span>{fragrance.Gender}</span>
            <span>{fragrance.Price ? `$${fragrance.Price}` : 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  };

  const results = useMemo(() => {
    let filteredData = fragranceData;

    // Apply search filter if there's a query
    if (query) {
      const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      filteredData = filteredData.filter(f => {
        const name = (f.Name || '').toLowerCase();
        const brand = (f.Brand || '').toLowerCase();
        const combined = `${name} ${brand}`;

        // All search terms must match somewhere in name or brand
        return searchTerms.every(term =>
          name.includes(term) || brand.includes(term) || combined.includes(term)
        );
      });
    }

    // Apply additional filters
    if (genderFilter) {
      filteredData = filteredData.filter(f =>
        (f.Gender || '').toLowerCase() === genderFilter.toLowerCase()
      );
    }

    if (brandFilter) {
      filteredData = filteredData.filter(f => f.Brand === brandFilter);
    }

    if (oilTypeFilter) {
      filteredData = filteredData.filter(f => f.OilType === oilTypeFilter);
    }

    return filteredData;
  }, [query, genderFilter, brandFilter, oilTypeFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-8 pt-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-light text-white">
              {query ? (
                <>Results for "<span className="font-medium italic">{query}</span>"</>
              ) : (
                'All Fragrances'
              )}
            </h1>
            <p className="text-gray-400 mt-2">Found {results.length} fragrances</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-3">
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
            </div>

            <div className="flex gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-orange-400 hover:text-orange-300 bg-orange-500/20 hover:bg-orange-500/30 px-4 py-2 rounded-full border border-orange-500/50 transition-all whitespace-nowrap backdrop-blur-sm"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => {
                  clearFilters();
                  navigate('/');
                }}
                className="text-sm font-medium text-gray-300 hover:text-white bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg hover:shadow-xl border border-gray-700/50 transition-all whitespace-nowrap"
              >
                {query ? 'Clear Search' : 'Browse All'}
              </button>
            </div>
          </div>
        </div>

        {results.length > 0 ? (
          <div className="space-y-6">
            {results.map((fragrance, index) => (
              <SearchResultCard
                key={index}
                fragrance={fragrance}
                onClick={() => navigate(`/fragrance/${fragranceData.indexOf(fragrance) + 1}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-dashed border-gray-700/50 relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl opacity-20 blur-sm"></div>
            <div className="relative">
              <p className="text-xl text-gray-400 font-light">No fragrances found matching "{query}"</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Browse all fragrances
              </button>
            </div>
          </div>
        )}
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default SearchResultsPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingChatButton from './FloatingChatButton';
import fragranceData from '../../fragrances_filtered.json';

const DiscoveryCard = ({ fragrance, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 cursor-pointer group hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out transform"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1 pr-4">
        <h3 className="text-lg font-medium text-gray-900 line-clamp-1 group-hover:text-gray-700 transition-colors">{fragrance.Name}</h3>
        <p className="text-sm text-gray-500">{fragrance.Brand}</p>
      </div>
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 group-hover:bg-white transition-colors">
        {fragrance["Image URL"] ? (
          <img src={fragrance["Image URL"]} alt={fragrance.Name} className="w-full h-full object-cover" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        )}
      </div>
    </div>
    <div className="flex gap-2 flex-wrap max-h-16 overflow-hidden">
      {(fragrance["General Notes"] || []).slice(0, 4).map((note, index) => (
        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {note}
        </span>
      ))}
    </div>
  </div>
);

const LandingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();

  // Handle search input changes
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length > 0) {
      const searchTerms = term.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      
      const suggestions = fragranceData
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
        navigate(`/fragrance/${index + 1}`);
        setShowSuggestions(false);
        setSearchTerm('');
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
    navigate(`/fragrance/${index + 1}`);
    setShowSuggestions(false);
    setSearchTerm('');
  };

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] pt-24 pb-8 px-4 md:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif italic text-gray-900 mb-2">Discover</h1>
          <p className="text-lg text-gray-500 font-light">Explore our curated collection of fine fragrances.</p>
        </div>

        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search fragrances..."
            className="w-full px-6 py-3 bg-white border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all pl-12 text-gray-900"
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
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-80 overflow-y-auto">
              {searchSuggestions.map((fragrance, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(fragrance)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left ${
                    selectedIndex === index ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                    {fragrance['Image URL'] ? (
                      <img src={fragrance['Image URL']} alt={fragrance.Name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{fragrance.Name}</h4>
                    <p className="text-xs text-gray-500 truncate">{fragrance.Brand}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Discovery Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        {fragranceData.map((fragrance, index) => (
          <DiscoveryCard
            key={index}
            fragrance={fragrance}
            onClick={() => navigate(`/fragrance/${index + 1}`)}
          />
        ))}
      </div>

      <FloatingChatButton />
    </div>
  );
};

export default LandingPage;

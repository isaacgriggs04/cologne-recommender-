import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import fragranceData from '../../fragrances_filtered.json';
import FloatingChatButton from './FloatingChatButton';
import { useFragranceContext } from '../context/FragranceContext';

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';

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
        className="bg-white rounded-3xl border border-gray-100 shadow-lg p-8 cursor-pointer group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out transform flex flex-col md:flex-row gap-8 items-center relative"
      >
        <button
          onClick={handleWishlistClick}
          className="absolute top-4 right-4 z-10 bg-black text-white px-3 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Add to Wishlist"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>

        <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 group-hover:bg-white transition-colors">
          {fragrance["Image URL"] ? (
            <img src={fragrance["Image URL"]} alt={fragrance.Name} className="w-full h-full object-contain p-4" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">{fragrance.Brand}</h2>
          <h3 className="text-3xl font-serif italic text-gray-900 mb-4 group-hover:text-gray-700 transition-colors">{fragrance.Name}</h3>

          <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
            {(fragrance["General Notes"] || []).slice(0, 6).map((note, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-100">
                {note}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-6 justify-center md:justify-start text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="text-yellow-500">★</span> {fragrance.rating}/5
            </span>
            <span>{fragrance.Gender}</span>
            <span>{fragrance.Price ? `$${fragrance.Price}` : 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  };

  const results = useMemo(() => {
    if (!query) return [];
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);

    return fragranceData.filter(f => {
      const name = (f.Name || '').toLowerCase();
      const brand = (f.Brand || '').toLowerCase();
      const combined = `${name} ${brand}`;

      // All search terms must match somewhere in name or brand
      return searchTerms.every(term =>
        name.includes(term) || brand.includes(term) || combined.includes(term)
      );
    });
  }, [query]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 pt-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-gray-900">
              Results for "<span className="font-medium italic">{query}</span>"
            </h1>
            <p className="text-gray-500 mt-2">Found {results.length} fragrances</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow border border-gray-200 transition-all"
          >
            Clear Search
          </button>
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
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-xl text-gray-400 font-light">No fragrances found matching "{query}"</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Browse all fragrances
            </button>
          </div>
        )}
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default SearchResultsPage;

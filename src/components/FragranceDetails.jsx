import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import fragranceData from '../../fragrances_filtered.json';
import FloatingChatButton from './FloatingChatButton';
import { useFragranceContext } from '../context/FragranceContext';

const FragranceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addFragrance } = useFragranceContext();

  // Check if user came from swipe page
  const cameFromSwipe = new URLSearchParams(location.search).get('from') === 'swipe';

  // Find the fragrance by ID (assuming ID matches index + 1 from MyCollection)
  // In a real app, you'd probably use a unique ID from the data itself
  const fragranceIndex = parseInt(id) - 1;
  const fragrance = fragranceData[fragranceIndex];

  const handleWishlistClick = () => {
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

  // Scroll to top when component mounts (navigating to fragrance profile)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  if (!fragrance) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-8 pt-20 flex flex-col items-center justify-center">
        <h1 className="text-2xl text-white mb-4">Fragrance not found</h1>
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white underline transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Helper to safely get arrays
  const notes = fragrance["General Notes"] || [];
  const accords = fragrance["Main Accords"] || [];
  const seasonRanking = fragrance["Season Ranking"] || [];
  const occasionRanking = fragrance["Occasion Ranking"] || [];

  // Get top season and occasion for badges
  const topSeason = seasonRanking.length > 0 ? seasonRanking[0].name : null;
  const topOccasion = occasionRanking.length > 0 ? occasionRanking[0].name : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8 pt-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => cameFromSwipe ? navigate('/swipe') : navigate(-1)}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {cameFromSwipe ? 'Back to Swipe' : 'Back'}
          </button>

          <button
            onClick={handleWishlistClick}
            className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 px-4 py-2 rounded-full text-sm font-medium transition-colors backdrop-blur-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add to Wishlist
          </button>
        </div>

        <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden relative">
          {/* Glowing border effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl opacity-30 blur-sm"></div>
          <div className="relative flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="md:w-1/3 bg-gray-900/50 p-8 flex items-center justify-center border-r border-gray-700/50">
              <div className="w-64 h-64 md:w-full md:h-auto aspect-square rounded-2xl bg-gray-800/50 p-4 shadow-lg flex items-center justify-center border border-gray-700/50">
                {fragrance["Image URL"] ? (
                  <img 
                    src={fragrance["Image URL"]} 
                    alt={fragrance.Name} 
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="text-gray-500">No Image</div>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="md:w-2/3 p-8 md:p-10 relative">
              <div className="mb-8">
                <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">{fragrance.Brand}</h2>
                <h1 className="text-4xl md:text-5xl font-serif italic text-white mb-4 leading-tight">{fragrance.Name}</h1>
                <div className="flex items-center gap-3 text-sm mt-4 flex-wrap">
                  <span className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 text-gray-300 px-3 py-2 rounded-full transition-colors cursor-default flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {fragrance.Gender}
                  </span>
                  <span className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 text-gray-300 px-3 py-2 rounded-full transition-colors cursor-default flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    {fragrance.OilType}
                  </span>
                  {topSeason && (
                    <span className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 px-3 py-2 rounded-full transition-colors cursor-default flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {topSeason}
                    </span>
                  )}
                  {topOccasion && (
                    <span className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 px-3 py-2 rounded-full transition-colors cursor-default flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {topOccasion}
                    </span>
                  )}
                  <span className="flex items-center text-yellow-400 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 px-3 py-2 rounded-full transition-colors cursor-default">
                    <span className="mr-1.5 text-yellow-400">★</span> {fragrance.rating}/5
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8 border-t border-gray-700/50 pt-6">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/30 transition-colors border border-gray-700/30">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Longevity</p>
                    <p className="font-medium text-white">{fragrance.Longevity || "Moderate"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/30 transition-colors border border-gray-700/30">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Sillage</p>
                    <p className="font-medium text-white">{fragrance.Sillage || "Moderate"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/30 transition-colors border border-gray-700/30">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Price</p>
                    <p className="font-medium text-white">${fragrance.Price || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/30 transition-colors border border-gray-700/30">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Year</p>
                    <p className="font-medium text-white">{fragrance.Year || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="border-t border-gray-700/50 pt-6">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Main Notes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {notes.map((note, i) => (
                      <span key={i} className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 text-gray-300 text-sm rounded-lg transition-all duration-200 cursor-default hover:shadow-lg hover:scale-105">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-700/50 pt-6">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                    Accords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {accords.slice(0, 6).map((accord, i) => (
                      <span key={i} className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 text-sm rounded-lg capitalize transition-all duration-200 cursor-default hover:shadow-lg hover:scale-105">
                        {accord}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Section: Rankings */}
          {(seasonRanking.length > 0 || occasionRanking.length > 0) && (
             <div className="bg-gray-900/50 p-8 border-t border-gray-700/50 relative">
                <div className="grid md:grid-cols-2 gap-8">
                  {seasonRanking.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Best Seasons</h3>
                      <div className="space-y-3">
                        {seasonRanking.map((season, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-xl border border-gray-700/50">
                            <span className="capitalize font-medium text-gray-300 w-24">{season.name}</span>
                            <div className="flex-1 h-2 mx-3 bg-gray-700/50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full" 
                                style={{ width: `${Math.min((season.score || 0) * 33, 100)}%` }} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {occasionRanking.length > 0 && (
                    <div>
                       <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Best Occasions</h3>
                       <div className="space-y-3">
                        {occasionRanking.map((occasion, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-xl border border-gray-700/50">
                            <span className="capitalize font-medium text-gray-300 w-24">{occasion.name}</span>
                            <div className="flex-1 h-2 mx-3 bg-gray-700/50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full" 
                                style={{ width: `${Math.min((occasion.score || 0) * 33, 100)}%` }} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
             </div>
          )}
        </div>
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default FragranceDetails;


import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import fragranceData from '../../fragrances_filtered.json';

const FragranceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Find the fragrance by ID (assuming ID matches index + 1 from MyCollection)
  // In a real app, you'd probably use a unique ID from the data itself
  const fragranceIndex = parseInt(id) - 1;
  const fragrance = fragranceData[fragranceIndex];

  if (!fragrance) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 pt-20 flex flex-col items-center justify-center">
        <h1 className="text-2xl text-gray-900 mb-4">Fragrance not found</h1>
        <button 
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-900 underline"
        >
          Return to Discovery
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
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 pt-20">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Discovery
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="md:w-1/3 bg-gray-50 p-8 flex items-center justify-center border-r border-gray-100">
              <div className="w-64 h-64 md:w-full md:h-auto aspect-square rounded-2xl bg-white p-4 shadow-sm flex items-center justify-center">
                {fragrance["Image URL"] ? (
                  <img 
                    src={fragrance["Image URL"]} 
                    alt={fragrance.Name} 
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="text-gray-300">No Image</div>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="md:w-2/3 p-8 md:p-10">
              <div className="mb-6">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">{fragrance.Brand}</h2>
                <h1 className="text-3xl md:text-4xl font-serif italic text-gray-900 mb-2">{fragrance.Name}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-3 flex-wrap">
                  <span className="bg-gray-100 px-3 py-1 rounded-full">{fragrance.Gender}</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full">{fragrance.OilType}</span>
                  {topSeason && (
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full capitalize">
                      {topSeason}
                    </span>
                  )}
                  {topOccasion && (
                    <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full capitalize">
                      {topOccasion}
                    </span>
                  )}
                  <span className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                    <span className="mr-1">★</span> {fragrance.rating}/5
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8 border-t border-b border-gray-100 py-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Longevity</p>
                  <p className="font-medium text-gray-900">{fragrance.Longevity || "Moderate"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sillage</p>
                  <p className="font-medium text-gray-900">{fragrance.Sillage || "Moderate"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Price</p>
                  <p className="font-medium text-gray-900">${fragrance.Price || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Year</p>
                  <p className="font-medium text-gray-900">{fragrance.Year || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Main Notes</h3>
                  <div className="flex flex-wrap gap-2">
                    {notes.map((note, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm rounded-lg border border-gray-100">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Accords</h3>
                  <div className="flex flex-wrap gap-2">
                    {accords.slice(0, 6).map((accord, i) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100 capitalize">
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
             <div className="bg-gray-50 p-8 border-t border-gray-100">
                <div className="grid md:grid-cols-2 gap-8">
                  {seasonRanking.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Best Seasons</h3>
                      <div className="space-y-3">
                        {seasonRanking.map((season, i) => (
                          <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                            <span className="capitalize font-medium text-gray-700 w-24">{season.name}</span>
                            <div className="flex-1 h-2 mx-3 bg-gray-100 rounded-full overflow-hidden">
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
                       <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Best Occasions</h3>
                       <div className="space-y-3">
                        {occasionRanking.map((occasion, i) => (
                          <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                            <span className="capitalize font-medium text-gray-700 w-24">{occasion.name}</span>
                            <div className="flex-1 h-2 mx-3 bg-gray-100 rounded-full overflow-hidden">
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
    </div>
  );
};

export default FragranceDetails;


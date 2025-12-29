import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useFragranceContext } from '../context/FragranceContext';
import { generateScentProfileDescription } from '../services/claudeApi';
import FloatingChatButton from './FloatingChatButton';
import { processMessageContent, RecommendationCard } from './ChatContainer';
import fragranceData from '../../fragrances_filtered.json';


const ScentProfile = () => {
  const [profileDescription, setProfileDescription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { items, addFragrance } = useFragranceContext();
  const navigate = useNavigate();

  const collection = useMemo(() => items.filter(item => item.listType === 'collection'), [items]);
  const wishlist = useMemo(() => items.filter(item => item.listType === 'wishlist'), [items]);
  const totalItems = collection.length + wishlist.length;


  const handleAddToWishlist = async (fragrance) => {
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

  const handleViewDetails = (fragrance) => {
    // Find the fragrance in the main database and navigate to its details page
    const fragranceIndex = fragranceData.findIndex(f =>
      f.Name === fragrance.Name && f.Brand === fragrance.Brand
    );

    if (fragranceIndex !== -1) {
      navigate(`/fragrance/${fragranceIndex + 1}`);
    }
  };

  // Generate scent personality when requested
  const generateScentProfile = async () => {
    if (totalItems === 0) return;

    setIsLoading(true);
    try {
      const description = await generateScentProfileDescription(collection, wishlist);
      setProfileDescription({
        personality: description.personality,
        recommendations: null
      });
    } catch (error) {
      console.error('Failed to generate scent profile:', error);
      setProfileDescription({
        personality: 'Unable to generate your scent profile at this time. Please try again later.',
        recommendations: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate recommendations when requested
  const generateRecommendations = async () => {
    if (totalItems === 0 || !profileDescription?.personality) return;

    setIsLoading(true);
    try {
      const description = await generateScentProfileDescription(collection, wishlist);
      setProfileDescription(prev => ({
        ...prev,
        recommendations: description.recommendations
      }));
      setShowRecommendations(true);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      setProfileDescription(prev => ({
        ...prev,
        recommendations: 'Unable to generate recommendations at this time. Please try again later.'
      }));
      setShowRecommendations(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-8 pt-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light tracking-tight text-white mb-2">Scent Profile</h1>
          <p className="text-lg text-gray-400 font-light">
            {totalItems > 0
              ? `Personalized profile based on ${collection.length} collection ${collection.length === 1 ? 'item' : 'items'} and ${wishlist.length} wishlist ${wishlist.length === 1 ? 'item' : 'items'}`
              : 'Add fragrances to your collection or wishlist to discover your unique scent personality'}
          </p>
        </div>

        {totalItems === 0 ? (
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-12 text-center relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-2xl opacity-20 blur-sm"></div>
            <div className="relative">
              <p className="text-gray-400 text-lg mb-4">No fragrances in your collection or wishlist yet.</p>
              <p className="text-gray-500 text-sm">Add fragrances to discover your personalized scent profile and preferences.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Loading State - show immediately when we have fragrances */}
            {isLoading && !profileDescription && (
              <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-700/50 relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl opacity-20 blur-sm"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-serif italic text-white">Your Scent Personality</h2>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-sm">Analyzing your preferences...</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-700/50 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-700/50 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-700/50 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-700/50 rounded animate-pulse w-5/6"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Scent Profile Description */}
            {profileDescription && (
              <>
                {/* Personality Box */}
                <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-700/50 mb-8 relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-3xl opacity-50 blur-sm"></div>
                  <div className="relative">
                    <h2 className="text-2xl font-serif italic mb-4 text-white">Your Scent Personality</h2>
                    {profileDescription ? (
                      <div className="claude-message text-gray-300">
                        <ReactMarkdown
                          components={{
                            p: ({node, ...props}) => <p className="mb-4" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                            em: ({node, ...props}) => <em className="italic" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 ml-4" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 ml-4" {...props} />,
                            li: ({node, ...props}) => <li className="ml-2" {...props} />,
                            code: ({node, inline, ...props}) =>
                              inline
                                ? <code className="bg-gray-900 px-1.5 py-0.5 rounded text-sm font-mono text-pink-300" {...props} />
                                : <code className="block bg-gray-900 p-3 rounded-lg text-sm font-mono text-pink-300 overflow-x-auto my-2" {...props} />,
                            pre: ({node, ...props}) => <pre className="bg-gray-900 p-3 rounded-lg overflow-x-auto my-2" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-2xl font-semibold text-white mt-6 mb-3" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-white mt-5 mb-2" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-white mt-4 mb-2" {...props} />,
                          }}
                        >
                          {profileDescription.personality}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-center py-8">
                        <p className="text-lg mb-2">Ready to discover your unique scent personality?</p>
                        <p className="text-sm">Click below to analyze your fragrance preferences and get personalized recommendations.</p>
                      </div>
                    )}

                    {/* Generate Profile Button */}
                    {!profileDescription && (
                      <div className="mt-6 pt-6 border-t border-gray-700/50">
                        <button
                          onClick={generateScentProfile}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50"
                        >
                          {isLoading ? 'Analyzing Your Preferences...' : 'Generate My Scent Profile'}
                        </button>
                      </div>
                    )}

                    {/* Get Recommendations Button */}
                    {profileDescription && !showRecommendations && (
                      <div className="mt-6 pt-6 border-t border-gray-700/50">
                        <button
                          onClick={generateRecommendations}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50"
                        >
                          {isLoading ? 'Finding Your Perfect Matches...' : 'Get Recommendations'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommendations Box */}
                {showRecommendations && (
                  <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-700/50 relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl opacity-20 blur-sm"></div>
                    <div className="relative">
                      <h2 className="text-2xl font-serif italic mb-6 text-white">Recommended for You</h2>

                      {/* Loading State for Recommendations */}
                      {isLoading && !profileDescription.recommendations && (
                        <div className="flex items-center justify-center py-8">
                          <div className="flex items-center space-x-3 text-gray-400">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            <span>Finding your perfect matches...</span>
                          </div>
                        </div>
                      )}

                      {/* Recommendations Content */}
                      {profileDescription.recommendations && (
                        <div className="text-gray-300 leading-relaxed space-y-6">
                          {/* This will be processed by your existing card rendering logic */}
                          {processMessageContent(profileDescription.recommendations).map((section, idx) => (
                            <div key={idx} className="space-y-4">
                              {/* Always show the markdown text first */}
                              {section.lines && section.lines.length > 0 && (
                                <div className="claude-message text-gray-300">
                                  <ReactMarkdown
                                    components={{
                                      p: ({node, ...props}) => <p className="mb-4" {...props} />,
                                      strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                                      em: ({node, ...props}) => <em className="italic" {...props} />,
                                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 ml-4" {...props} />,
                                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 ml-4" {...props} />,
                                      li: ({node, ...props}) => <li className="ml-2" {...props} />,
                                      code: ({node, inline, ...props}) =>
                                        inline
                                          ? <code className="bg-gray-900 px-1.5 py-0.5 rounded text-sm font-mono text-pink-300" {...props} />
                                          : <code className="block bg-gray-900 p-3 rounded-lg text-sm font-mono text-pink-300 overflow-x-auto my-2" {...props} />,
                                      pre: ({node, ...props}) => <pre className="bg-gray-900 p-3 rounded-lg overflow-x-auto my-2" {...props} />,
                                      h1: ({node, ...props}) => <h1 className="text-2xl font-semibold text-white mt-6 mb-3" {...props} />,
                                      h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-white mt-5 mb-2" {...props} />,
                                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-white mt-4 mb-2" {...props} />,
                                    }}
                                  >
                                    {section.lines.join('\n')}
                                  </ReactMarkdown>
                                </div>
                              )}
                              {/* Then show the fragrance card below if there's a match */}
                              {section.fragrance && (
                                <RecommendationCard
                                  fragrance={section.fragrance}
                                  onAddToWishlist={handleAddToWishlist}
                                  onViewDetails={handleViewDetails}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-700/50 relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl opacity-20 blur-sm"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-serif italic text-white">Your Scent Personality</h2>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-sm">Analyzing your preferences...</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-700/50 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-700/50 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-700/50 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-700/50 rounded animate-pulse w-5/6"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Collection Summary */}
            <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8 relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-2xl opacity-20 blur-sm"></div>
              <div className="relative">
                <h2 className="text-xl font-medium text-white mb-4">Your Fragrance Collection</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">{collection.length}</div>
                    <div className="text-sm text-gray-400">Owned Fragrances</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">{wishlist.length}</div>
                    <div className="text-sm text-gray-400">Wishlist Items</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default ScentProfile;

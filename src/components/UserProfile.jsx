import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useUser } from '@clerk/clerk-react';
import { useFragranceContext } from '../context/FragranceContext';
import { generateScentProfileDescription } from '../services/claudeApi';
import { processMessageContent, RecommendationCard } from './ChatContainer';
import fragranceData from '../../fragrances_filtered.json';
import FloatingChatButton from './FloatingChatButton';

const UserProfile = () => {
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  const { items, addFragrance, recommendations, setRecommendations, recommendationsShown, setRecommendationsShown } = useFragranceContext();
  const navigate = useNavigate();

  const collection = useMemo(() => items.filter(item => item.listType === 'collection'), [items]);
  const wishlist = useMemo(() => items.filter(item => item.listType === 'wishlist'), [items]);
  const totalItems = collection.length + wishlist.length;

  // Get user data from Clerk
  const { user: clerkUser } = useUser();

  const user = {
    name: clerkUser?.firstName || clerkUser?.username || "User",
    email: clerkUser?.primaryEmailAddress?.emailAddress || "user@example.com",
    avatar: clerkUser?.imageUrl || `https://ui-avatars.com/api/?name=${clerkUser?.firstName || "User"}&background=111827&color=fff`,
    joined: clerkUser?.createdAt ? new Date(clerkUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently",
    stats: {
      collection: collection.length,
      wishlist: wishlist.length,
      reviews: 0 // You can implement this later if you track reviews
    }
  };

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

  // Generate recommendations based on collection
  const generateRecommendations = async () => {
    if (totalItems === 0) {
      alert('Please add fragrances to your collection or wishlist first.');
      return;
    }

    setIsLoadingRecommendations(true);
    setRecommendationsShown(true);
    try {
      const description = await generateScentProfileDescription(collection, wishlist);
      setRecommendations(description.recommendations || 'Unable to generate recommendations at this time. Please try again later.');
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      setRecommendations('Unable to generate recommendations at this time. Please try again later.');
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-8 pt-24 flex justify-center">
      <div className="w-full max-w-4xl animate-fade-in">
        {/* Profile Header */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden mb-8 relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl opacity-20 blur-sm"></div>
          <div className="relative">
            <div className="h-32 bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50"></div>
            <div className="px-8 pb-8">
              <div className="relative flex justify-between items-end -mt-12 mb-6">
                <div className="flex items-end">
                  <div className="w-24 h-24 rounded-full border-4 border-gray-800 shadow-md overflow-hidden bg-gray-700">
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="ml-4 mb-1">
                    <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                    <p className="text-sm text-gray-400">Member since {user.joined}</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 border-t border-gray-700/50 pt-6">
                <div className="text-center p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                  <div className="text-2xl font-bold text-white">{user.stats.collection}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">Fragrances</div>
                </div>
                <div className="text-center p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                  <div className="text-2xl font-bold text-white">{user.stats.wishlist}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">Wishlist</div>
                </div>
                <div className="text-center p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                  <div className="text-2xl font-bold text-white">{user.stats.reviews}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 p-8 relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl opacity-20 blur-sm"></div>
          <div className="relative">
            <h2 className="text-lg font-bold text-white mb-4">Personalized Recommendations</h2>
            <p className="text-sm text-gray-400 mb-6">
              Get fragrance recommendations based on your collection ({collection.length} items) and wishlist ({wishlist.length} items)
            </p>

            {!recommendationsShown ? (
              <button
                onClick={generateRecommendations}
                disabled={isLoadingRecommendations || totalItems === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50"
              >
                {totalItems === 0
                  ? 'Add fragrances to get recommendations'
                  : isLoadingRecommendations
                  ? 'Generating Recommendations...'
                  : 'Get Recommendations'}
              </button>
            ) : (
              <div className="space-y-4">
                {/* Loading State */}
                {isLoadingRecommendations && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-3 text-gray-400">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                      <span>Finding your perfect matches...</span>
                    </div>
                  </div>
                )}

                {/* Recommendations Content */}
                {!isLoadingRecommendations && recommendations && (
                  <div className="text-gray-300 leading-relaxed space-y-6">
                    {processMessageContent(recommendations).map((section, idx) => (
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

                {/* Regenerate Button */}
                {!isLoadingRecommendations && (
                  <div className="pt-4 border-t border-gray-700/50">
                    <button
                      onClick={generateRecommendations}
                      disabled={isLoadingRecommendations}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50"
                    >
                      {isLoadingRecommendations ? 'Generating Recommendations...' : 'Regenerate Recommendations'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default UserProfile;


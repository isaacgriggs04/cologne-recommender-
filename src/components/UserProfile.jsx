import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useFragranceContext } from '../context/FragranceContext';
import { generateScentProfileDescription } from '../services/claudeApi';
import FragranceResponseRenderer from './FragranceResponseRenderer';
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-8 pt-24 sm:pt-28 flex justify-center">
      <div className="w-full max-w-4xl animate-fade-in">
        {/* Profile Header */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden mb-6 sm:mb-8 relative">
          <div className="absolute -inset-0.5 bg-blue-300 rounded-2xl sm:rounded-3xl opacity-10 blur-sm"></div>
          <div className="relative">
            <div className="h-24 sm:h-32 bg-blue-900/50"></div>
            <div className="px-4 sm:px-8 pb-6 sm:pb-8">
              <div className="relative flex justify-between items-end -mt-8 sm:-mt-12 mb-4 sm:mb-6">
                <div className="flex items-end">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-gray-800 shadow-md overflow-hidden bg-gray-700">
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="ml-3 sm:ml-4 mb-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">{user.name}</h1>
                    <p className="text-[10px] sm:text-sm text-gray-400">Member since {user.joined}</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t border-gray-700/50 pt-4 sm:pt-6">
                <div className="text-center p-2 sm:p-4 bg-gray-900/50 rounded-xl sm:rounded-2xl border border-gray-700/50">
                  <div className="text-lg sm:text-2xl font-bold text-white">{user.stats.collection}</div>
                  <div className="text-[8px] sm:text-xs text-gray-400 uppercase tracking-wide font-medium">Owned</div>
                </div>
                <div className="text-center p-2 sm:p-4 bg-gray-900/50 rounded-xl sm:rounded-2xl border border-gray-700/50">
                  <div className="text-lg sm:text-2xl font-bold text-white">{user.stats.wishlist}</div>
                  <div className="text-[8px] sm:text-xs text-gray-400 uppercase tracking-wide font-medium">Wishlist</div>
                </div>
                <div className="text-center p-2 sm:p-4 bg-gray-900/50 rounded-xl sm:rounded-2xl border border-gray-700/50">
                  <div className="text-lg sm:text-2xl font-bold text-white">{user.stats.reviews}</div>
                  <div className="text-[8px] sm:text-xs text-gray-400 uppercase tracking-wide font-medium">Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-700/50 p-5 sm:p-8 relative">
          <div className="absolute -inset-0.5 bg-blue-300 rounded-2xl sm:rounded-3xl opacity-10 blur-sm"></div>
          <div className="relative">
            <h2 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-4">Personalized Recommendations</h2>
            <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
              Get fragrance recommendations based on your collection ({collection.length}) and wishlist ({wishlist.length})
            </p>

            {!recommendationsShown ? (
              <button
                onClick={generateRecommendations}
                disabled={isLoadingRecommendations || totalItems === 0}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform sm:hover:scale-[1.02] disabled:transform-none disabled:opacity-50 text-sm sm:text-base"
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
                  <div className="flex items-center justify-center py-6 sm:py-8">
                    <div className="flex items-center space-x-3 text-gray-400">
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-500"></div>
                      <span className="text-xs sm:text-base">Finding your perfect matches...</span>
                    </div>
                  </div>
                )}

                {/* Recommendations Content */}
                {!isLoadingRecommendations && recommendations && (
                  <div className="chat-recommendations">
                    <FragranceResponseRenderer
                      text={recommendations}
                      onAddToWishlist={handleAddToWishlist}
                      onViewDetails={handleViewDetails}
                    />
                  </div>
                )}

                {/* Regenerate Button */}
                {!isLoadingRecommendations && (
                  <div className="pt-4 border-t border-gray-700/50">
                    <button
                      onClick={generateRecommendations}
                      disabled={isLoadingRecommendations}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform sm:hover:scale-[1.02] disabled:transform-none disabled:opacity-50 text-sm sm:text-base"
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


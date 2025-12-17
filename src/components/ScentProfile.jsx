import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFragranceContext } from '../context/FragranceContext';
import { generateScentProfileDescription } from '../services/claudeApi';
import FloatingChatButton from './FloatingChatButton';
import { processMessageContent, RecommendationCard } from './ChatContainer';


const ScentProfile = () => {
  const [profileDescription, setProfileDescription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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
    // Navigate back to chat page instead of fragrance details
    navigate('/chat');
  };

  // Generate scent profile description when fragrances change
  useEffect(() => {
    const generateDescription = async () => {
      if (totalItems === 0) {
        setProfileDescription(null);
        return;
      }

      setIsLoading(true);
      try {
        const description = await generateScentProfileDescription(collection, wishlist);
        console.log('Profile description result:', description);
        setProfileDescription(description);
      } catch (error) {
        console.error('Failed to generate scent profile:', error);
        setProfileDescription({
          personality: 'Unable to generate your scent profile at this time. Please try again later.',
          recommendations: ''
        });
      } finally {
        setIsLoading(false);
      }
    };

    generateDescription();
  }, [collection, wishlist]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 pt-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light tracking-tight text-gray-900 mb-2">Scent Profile</h1>
          <p className="text-lg text-gray-500 font-light">
            {totalItems > 0
              ? `Personalized profile based on ${collection.length} collection ${collection.length === 1 ? 'item' : 'items'} and ${wishlist.length} wishlist ${wishlist.length === 1 ? 'item' : 'items'}`
              : 'Add fragrances to your collection or wishlist to discover your unique scent personality'}
          </p>
        </div>

        {totalItems === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No fragrances in your collection or wishlist yet.</p>
            <p className="text-gray-400 text-sm">Add fragrances to discover your personalized scent profile and preferences.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Scent Profile Description */}
            {profileDescription && (
              <>
                {/* Personality Box */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
                  <h2 className="text-2xl font-serif italic mb-4 text-gray-900">Your Scent Personality</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {profileDescription.personality || 'Analyzing your fragrance preferences...'}
                  </p>
                </div>

                {/* Recommendations Box */}
                {profileDescription.recommendations && (
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-serif italic mb-6 text-gray-900">Recommended for You</h2>
                    <div className="text-gray-700 leading-relaxed">
                      {/* This will be processed by your existing card rendering logic */}
                      {processMessageContent(profileDescription.recommendations).map((section, idx) => (
                        <div key={idx}>
                          {section.fragrance ? (
                            <RecommendationCard
                              fragrance={section.fragrance}
                              onAddToWishlist={handleAddToWishlist}
                              onViewDetails={handleViewDetails}
                            />
                          ) : (
                            <p className="mb-4">{section.lines?.join('\n') || section.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif italic text-gray-900">Your Scent Personality</h2>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span className="text-sm">Analyzing your preferences...</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                </div>
              </div>
            )}

            {/* Collection Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Your Fragrance Collection</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{collection.length}</div>
                  <div className="text-sm text-gray-500">Owned Fragrances</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{wishlist.length}</div>
                  <div className="text-sm text-gray-500">Wishlist Items</div>
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

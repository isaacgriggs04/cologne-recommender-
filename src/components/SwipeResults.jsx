import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { prepareSwipeData, getSwipeBasedRecommendations } from '../services/claudeApi';
import FloatingChatButton from './FloatingChatButton';
import FragranceResponseRenderer from './FragranceResponseRenderer';
import { useFragranceContext } from '../context/FragranceContext';
import fragranceData from '../../fragrances_filtered.json';

const SwipeResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    addFragrance, 
    recommendations, 
    setRecommendations, 
    swipeHistoryUsed, 
    setSwipeHistoryUsed 
  } = useFragranceContext();
  const [loading, setLoading] = useState(!recommendations);
  const [error, setError] = useState(null);

  const swipeHistory = location.state?.swipeHistory || [];

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
    const fragranceIndex = fragranceData.findIndex(f => f.Name === fragrance.Name && f.Brand === fragrance.Brand);
    if (fragranceIndex !== -1) {
      navigate(`/fragrance/${fragranceIndex + 1}`);
    }
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        if (swipeHistory.length === 0) {
          setError('No swipe history found. Please swipe through some fragrances first.');
          setLoading(false);
          return;
        }

        // Check if we already have recommendations for THIS swipe history
        // We'll compare history length and the last item to see if it's the same
        const isSameHistory = recommendations && 
                             swipeHistoryUsed && 
                             swipeHistory.length === swipeHistoryUsed.length &&
                             swipeHistory[swipeHistory.length - 1]?.fragrance?.Name === 
                             swipeHistoryUsed[swipeHistoryUsed.length - 1]?.fragrance?.Name;

        if (isSameHistory) {
          console.log('Using cached recommendations');
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // Prepare swipe data
        const swipeData = prepareSwipeData(swipeHistory);

        // Check if user has any meaningful swipes (loved, liked, or meh)
        const hasMeaningfulSwipes = swipeData.loved.length > 0 || swipeData.liked.length > 0 || swipeData.meh.length > 0;

        if (!hasMeaningfulSwipes) {
          setError('You need to swipe through fragrances first. Try loving, liking, or hating some fragrances to get personalized recommendations.');
          setLoading(false);
          return;
        }

        // Get recommendations
        const result = await getSwipeBasedRecommendations(swipeData);
        setRecommendations(result);
        setSwipeHistoryUsed([...swipeHistory]);

      } catch (err) {
        console.error('Error fetching swipe recommendations:', err);
        setError(err.message || 'Failed to generate recommendations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [swipeHistory, recommendations, swipeHistoryUsed, setRecommendations, setSwipeHistoryUsed]);

  const handleRefreshRecommendations = async () => {
    const swipeData = prepareSwipeData(swipeHistory);
    const hasMeaningfulSwipes = swipeData.loved.length > 0 || swipeData.liked.length > 0 || swipeData.meh.length > 0;

    if (!hasMeaningfulSwipes) {
      setError('You need to swipe through fragrances first. Try loving, liking, or hating some fragrances to get personalized recommendations.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getSwipeBasedRecommendations(swipeData);
      setRecommendations(result);
      setSwipeHistoryUsed([...swipeHistory]);
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
      setError(err.message || 'Failed to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-20 pb-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h1 className="text-2xl font-serif italic text-white mb-4">Analyzing Your Preferences</h1>
            <p className="text-gray-400">We're using AI to understand your fragrance preferences and find the perfect recommendations...</p>
          </div>
        </div>
        <FloatingChatButton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-20 pb-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8 text-center">
            <div className="text-red-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-2xl font-serif italic text-white mb-4">Unable to Generate Recommendations</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/swipe')}
                className="bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 text-white px-6 py-2 rounded-lg font-medium transition-colors backdrop-blur-sm"
              >
                Go Back to Swipe
              </button>
            </div>
          </div>
        </div>
        <FloatingChatButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-24 sm:pt-28 pb-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif italic text-white text-center sm:text-left leading-tight">Your Recommendations</h1>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleRefreshRecommendations}
              className="flex-1 sm:flex-none bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm backdrop-blur-sm"
              disabled={loading}
            >
              Refresh
            </button>
            <button
              onClick={() => navigate('/swipe')}
              className="flex-1 sm:flex-none bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm backdrop-blur-sm"
            >
              Swipe More
            </button>
          </div>
        </div>

        {/* Analysis Section */}
        {recommendations?.analysis && (
          <div className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 p-5 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-serif italic text-white mb-3 sm:mb-4">Your Scent Profile</h2>
            <div className="claude-message">
              <ReactMarkdown
                components={{
                  p: ({node, ...props}) => <p className="mb-3 sm:mb-4 text-xs sm:text-base" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 sm:mb-4 space-y-1 sm:space-y-2 ml-2 sm:ml-4 text-xs sm:text-base" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 sm:mb-4 space-y-1 sm:space-y-2 ml-2 sm:ml-4 text-xs sm:text-base" {...props} />,
                  li: ({node, ...props}) => <li className="ml-1 sm:ml-2" {...props} />,
                  code: ({node, inline, ...props}) => 
                    inline 
                      ? <code className="bg-gray-900 px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-sm font-mono text-pink-300" {...props} />
                      : <code className="block bg-gray-900 p-2 sm:p-3 rounded-lg text-[10px] sm:text-sm font-mono text-pink-300 overflow-x-auto my-1 sm:my-2" {...props} />,
                  pre: ({node, ...props}) => <pre className="bg-gray-900 p-2 sm:p-3 rounded-lg overflow-x-auto my-1 sm:my-2 text-[10px] sm:text-sm" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-xl sm:text-2xl font-semibold text-white mt-4 sm:mt-6 mb-2 sm:mb-3" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg sm:text-xl font-semibold text-white mt-3 sm:mt-5 mb-1 sm:mb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base sm:text-lg font-semibold text-white mt-3 sm:mt-4 mb-1 sm:mb-2" {...props} />,
                }}
              >
                {recommendations.analysis}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {recommendations?.recommendations && (
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-5 sm:p-6 mb-8">
            <h2 className="text-lg sm:text-xl font-serif italic text-white mb-4 sm:mb-6">Recommended Fragrances</h2>
            <div className="chat-recommendations">
              <FragranceResponseRenderer 
                text={recommendations.recommendations}
                onAddToWishlist={handleAddToWishlist}
                onViewDetails={handleViewDetails}
              />
            </div>
          </div>
        )}
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default SwipeResults;

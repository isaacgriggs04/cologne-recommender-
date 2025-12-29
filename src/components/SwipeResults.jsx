import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { prepareSwipeData, getSwipeBasedRecommendations } from '../services/claudeApi';
import FloatingChatButton from './FloatingChatButton';

const SwipeResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  const swipeHistory = location.state?.swipeHistory || [];

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        if (swipeHistory.length === 0) {
          setError('No swipe history found. Please swipe through some fragrances first.');
          return;
        }

        // Prepare swipe data
        const swipeData = prepareSwipeData(swipeHistory);

        // Check if user has any meaningful swipes (loved, liked, or meh)
        const hasMeaningfulSwipes = swipeData.loved.length > 0 || swipeData.liked.length > 0 || swipeData.meh.length > 0;

        if (!hasMeaningfulSwipes) {
          setError('You need to swipe through fragrances first. Try loving, liking, or hating some fragrances to get personalized recommendations.');
          return;
        }

        // Get recommendations
        const result = await getSwipeBasedRecommendations(swipeData);
        setRecommendations(result);

      } catch (err) {
        console.error('Error fetching swipe recommendations:', err);
        setError(err.message || 'Failed to generate recommendations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [swipeHistory]);

  const handleRefreshRecommendations = async () => {
    const swipeData = prepareSwipeData(swipeHistory);
    const hasMeaningfulSwipes = swipeData.loved.length > 0 || swipeData.liked.length > 0 || swipeData.hated.length > 0;

    if (!hasMeaningfulSwipes) {
      setError('You need to swipe through fragrances first. Try loving, liking, or hating some fragrances to get personalized recommendations.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getSwipeBasedRecommendations(swipeData);
      setRecommendations(result);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-20 pb-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-serif italic text-white">Your Personalized Recommendations</h1>
          <div className="flex gap-3">
            <button
              onClick={handleRefreshRecommendations}
              className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm backdrop-blur-sm"
              disabled={loading}
            >
              Refresh
            </button>
            <button
              onClick={() => navigate('/swipe')}
              className="bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm backdrop-blur-sm"
            >
              Swipe More
            </button>
          </div>
        </div>

        {/* Analysis Section */}
        {recommendations?.analysis && (
          <div className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 p-6 mb-8">
            <h2 className="text-xl font-serif italic text-white mb-4">Your Scent Profile</h2>
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
                {recommendations.analysis}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {recommendations?.recommendations && (
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6">
            <h2 className="text-xl font-serif italic text-white mb-6">Recommended Fragrances</h2>
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
                {recommendations.recommendations}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default SwipeResults;

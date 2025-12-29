import React from 'react';
import { useNavigate } from 'react-router-dom';
import ChatContainer from './ChatContainer';

const ChatPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 container-padding pt-16 sm:pt-20">
      {/* Back to Discovery Button */}
      <div className="max-w-3xl mx-auto mb-3 sm:mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors group touch-target p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to Discovery</span>
        </button>
      </div>
      <ChatContainer />
    </div>
  );
};

export default ChatPage;

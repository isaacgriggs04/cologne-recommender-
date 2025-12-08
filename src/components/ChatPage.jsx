import React from 'react';
import { useNavigate } from 'react-router-dom';
import ChatContainer from './ChatContainer';

const ChatPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-20">
      {/* Back to Discovery Button */}
      <div className="max-w-3xl mx-auto px-4 mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
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

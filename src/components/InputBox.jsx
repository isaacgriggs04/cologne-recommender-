import React, { useState } from 'react';

const InputBox = ({ onInputChange, onInputSubmit, disabled = false }) => {
  const [inputValue, setInputValue] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (onInputChange) {
      onInputChange(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onInputSubmit && inputValue.trim()) {
      onInputSubmit(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative group">
      <div className="flex gap-3 items-end">
        <div className="relative flex-1">
          <textarea
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe your ideal fragrance..."
            disabled={disabled}
            className="input-mobile w-full px-4 py-3 sm:px-6 sm:py-5 text-base sm:text-lg bg-gray-900/50 rounded-xl sm:rounded-2xl border border-gray-700/50 shadow-lg hover:border-blue-500/50 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none overflow-y-auto transition-all duration-200 placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white backdrop-blur-sm touch-target"
            style={{ fontFamily: "'Inter', sans-serif" }}
            rows={3}
          />
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Press Enter to send
          </div>
        </div>
        <button
          type="submit"
          disabled={disabled || !inputValue.trim()}
          className="bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 text-white px-6 py-3 sm:px-8 sm:py-5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed touch-target"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default InputBox;


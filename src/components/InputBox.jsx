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
      <textarea
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Describe your ideal fragrance..."
        disabled={disabled}
        className="input-mobile w-full px-4 py-3 sm:px-6 sm:py-5 text-base sm:text-lg bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm hover:border-gray-300 focus:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 resize-none overflow-y-auto transition-all duration-200 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-light touch-target"
        rows={3}
      />
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        Press Enter to send
      </div>
    </form>
  );
};

export default InputBox;


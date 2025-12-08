import React, { createContext, useContext, useState, useEffect } from 'react';

const FragranceContext = createContext();

export const useFragranceContext = () => {
  const context = useContext(FragranceContext);
  if (!context) {
    throw new Error('useFragranceContext must be used within FragranceProvider');
  }
  return context;
};

export const FragranceProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('fragranceCollection');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [chatHistory, setChatHistory] = useState([]);
  const [chatInitialized, setChatInitialized] = useState(false);

  useEffect(() => {
    // Save to localStorage whenever items change
    localStorage.setItem('fragranceCollection', JSON.stringify(items));
  }, [items]);

  const addFragrance = (fragrance) => {
    setItems(prev => [...prev, fragrance]);
  };

  const removeFragrance = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateFragrance = (id, updates) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const getCollection = () => items.filter(item => item.listType === 'collection');
  const getWishlist = () => items.filter(item => item.listType === 'wishlist');

  return (
    <FragranceContext.Provider value={{
      items,
      addFragrance,
      removeFragrance,
      updateFragrance,
      getCollection,
      getWishlist,
      chatHistory,
      setChatHistory,
      chatInitialized,
      setChatInitialized,
    }}>
      {children}
    </FragranceContext.Provider>
  );
};
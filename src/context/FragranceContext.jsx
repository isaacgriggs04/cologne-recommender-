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

  const [recommendations, setRecommendations] = useState(() => {
    // Load recommendations from localStorage if available
    const saved = localStorage.getItem('userRecommendations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [recommendationsShown, setRecommendationsShown] = useState(() => {
    // Load whether recommendations are shown from localStorage
    const saved = localStorage.getItem('recommendationsShown');
    return saved ? JSON.parse(saved) : false;
  });

  const [chatHistory, setChatHistory] = useState([]);
  const [chatInitialized, setChatInitialized] = useState(false);

  useEffect(() => {
    // Save to localStorage whenever items change
    localStorage.setItem('fragranceCollection', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    // Save recommendations to localStorage whenever they change
    if (recommendations !== null) {
      localStorage.setItem('userRecommendations', JSON.stringify(recommendations));
    } else {
      localStorage.removeItem('userRecommendations');
    }
  }, [recommendations]);

  useEffect(() => {
    // Save recommendations shown state to localStorage
    localStorage.setItem('recommendationsShown', JSON.stringify(recommendationsShown));
  }, [recommendationsShown]);

  const addFragrance = (fragrance) => {
    setItems(prev => {
      // Check if fragrance already exists in the same list type
      const exists = prev.some(item =>
        item.name === fragrance.name &&
        item.brand === fragrance.brand &&
        item.listType === fragrance.listType
      );

      // Only add if it doesn't already exist
      if (!exists) {
        return [...prev, fragrance];
      }
      return prev;
    });
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
      recommendations,
      setRecommendations,
      recommendationsShown,
      setRecommendationsShown,
      chatHistory,
      setChatHistory,
      chatInitialized,
      setChatInitialized,
    }}>
      {children}
    </FragranceContext.Provider>
  );
};
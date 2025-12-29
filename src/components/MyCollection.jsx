import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFragranceContext } from '../context/FragranceContext';
import fragranceData from '../../fragrances_filtered.json';
import FloatingChatButton from './FloatingChatButton';

const FragranceCard = ({ fragrance, onClick, onRemove }) => (
  <div
    onClick={onClick}
    className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-xl p-6 cursor-pointer group hover:border-blue-500/50 hover:scale-105 transition-all duration-300 ease-in-out transform relative"
  >
    {/* Glowing border effect on hover */}
    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-purple-500/0 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500"></div>
    
    {onRemove && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(fragrance.id);
        }}
        className="absolute top-2 right-2 z-10 bg-red-500/80 hover:bg-red-500 border border-red-400/50 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors shadow-lg backdrop-blur-sm"
        title="Remove from collection"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
    <div className="relative flex justify-between items-start mb-4">
      <div className="flex-1 pr-4">
        <h3 className="text-lg font-medium text-white line-clamp-1 group-hover:text-blue-300 transition-colors">{fragrance.name}</h3>
        <p className="text-sm text-gray-400">{fragrance.brand}</p>
      </div>
      <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-600/50 group-hover:border-blue-500/50 transition-colors">
        {fragrance.image ? (
          <img src={fragrance.image} alt={fragrance.name} className="w-full h-full object-cover" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        )}
      </div>
    </div>
    <div className="relative flex gap-2 flex-wrap max-h-16 overflow-hidden">
      {fragrance.notes.slice(0, 4).map((note, index) => (
        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300 border border-gray-600/50">
          {note}
        </span>
      ))}
    </div>
  </div>
);

const AddFragranceModal = ({ isOpen, onClose, onAdd, activeTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [listType, setListType] = useState(activeTab);
  const [searchResults, setSearchResults] = useState([]);

  // Update listType when activeTab changes
  React.useEffect(() => {
    setListType(activeTab);
  }, [activeTab]);

  // Handle search logic
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length > 0) {
      const results = fragranceData.filter(f => 
        (f.Name && f.Name.toLowerCase().includes(term.toLowerCase())) ||
        (f.Brand && f.Brand.toLowerCase().includes(term.toLowerCase()))
      ).slice(0, 8); // Limit results for autofill
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  if (!isOpen) return null;

  const handleSelectFragrance = (fragrance) => {
    onAdd({
      id: Date.now(),
      name: fragrance.Name,
      brand: fragrance.Brand,
      notes: fragrance['General Notes'] || [],
      accords: fragrance['Main Accords'] || [],
      accordsPercentage: fragrance['Main Accords Percentage'] || {},
      image: fragrance['Image URL'],
      listType,
      // Store full fragrance data for scent profile
      fragranceData: fragrance
    });
    setSearchTerm('');
    setSearchResults([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 w-full max-w-md p-6 animate-fade-in max-h-[90vh] flex flex-col relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-2xl opacity-30 blur-sm"></div>
        <div className="relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-white">Add to {listType === 'collection' ? 'Collection' : 'Wishlist'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* List Type Toggle */}
            <div className="flex p-1 bg-gray-700/50 rounded-lg mb-4 flex-shrink-0 border border-gray-600/50">
              <button
                type="button"
                onClick={() => setListType('collection')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  listType === 'collection'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Collection
              </button>
              <button
                type="button"
                onClick={() => setListType('wishlist')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  listType === 'wishlist'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Wishlist
              </button>
            </div>

            <div className="relative flex-shrink-0">
              <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">Search Fragrances</label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  autoFocus
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-700/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50 transition-colors bg-gray-900/50 focus:bg-gray-900 text-white placeholder-gray-500"
                  placeholder="Search by name or brand..."
                  value={searchTerm}
                  onChange={handleSearch}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      // Suggestions will show automatically when searchTerm has value
                    }
                  }}
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 absolute left-3 top-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                
                {/* Autofill Suggestions Dropdown */}
                {searchTerm.length > 0 && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden z-50 max-h-64 overflow-y-auto">
                    {searchResults.map((fragrance, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectFragrance(fragrance)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-700/50 transition-colors text-left border-b border-gray-700/50 last:border-b-0"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-700/50 flex-shrink-0 overflow-hidden border border-gray-600/50">
                          {fragrance['Image URL'] ? (
                            <img src={fragrance['Image URL']} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">{fragrance.Name}</h4>
                          <p className="text-xs text-gray-400 truncate">{fragrance.Brand}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[200px]">
              {searchTerm.length > 0 && searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No fragrances found matching "{searchTerm}"
                </div>
              ) : searchTerm.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Start typing to search...
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MyCollection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('collection'); // 'collection' or 'wishlist'
  const navigate = useNavigate();
  const { items, addFragrance, removeFragrance, getCollection, getWishlist } = useFragranceContext();

  const handleAddFragrance = (newFragrance) => {
    addFragrance(newFragrance);
  };

  const filteredItems = activeTab === 'collection' ? getCollection() : getWishlist();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-8 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-white mb-2 font-serif italic">My Collection</h1>
            <p className="text-lg text-gray-400 font-light">Manage your personal fragrance wardrobe</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="bg-gray-800/60 backdrop-blur-sm p-1 rounded-full border border-gray-700/50 shadow-lg flex">
              <button
                onClick={() => setActiveTab('collection')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === 'collection'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Owned
              </button>
              <button
                onClick={() => setActiveTab('wishlist')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === 'wishlist'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Wishlist
              </button>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="group flex items-center gap-2 px-5 py-2.5 text-sm text-white bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden md:inline">Add Fragrance</span>
              <span className="md:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((fragrance) => (
            <FragranceCard
              key={fragrance.id}
              fragrance={fragrance}
              onClick={() => navigate(`/fragrance/${fragrance.id}`)}
              onRemove={removeFragrance}
            />
          ))}
          
          {/* Empty state card / Add button alternative */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center justify-center p-6 h-full min-h-[200px] rounded-2xl border-2 border-dashed border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all duration-200 group bg-gray-800/30 backdrop-blur-sm"
          >
            <div className="w-12 h-12 rounded-full bg-gray-700/50 group-hover:bg-blue-500/20 flex items-center justify-center text-gray-400 group-hover:text-blue-300 mb-3 transition-colors border border-gray-600/50 group-hover:border-blue-500/50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-400 group-hover:text-white">
              Add to {activeTab === 'collection' ? 'Collection' : 'Wishlist'}
            </span>
          </button>
        </div>

        <AddFragranceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddFragrance}
          activeTab={activeTab}
        />
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default MyCollection;

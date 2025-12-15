import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFragranceContext } from '../context/FragranceContext';
import InputBox from './InputBox';
import { getFragranceRecommendation } from '../services/claudeApi';
import fragranceData from '../../fragrances_filtered.json';

// Shared fragrance matching logic
const patterns = [
  // "1. Name by Brand" or bullet variants
  /^[\d\-\•\*\.]+\s*(.+?)\s+by\s+(.+?)(?:\s|$|,|\.)/i,
  /^(.+?)\s+by\s+(.+?)(?:\s|$|,|\.)/i,
  // Markdown headings like "### **2. Name**" or "### 2. **Name**"
  /^#{2,6}\s*[\d\.\)\-\s]*\**\s*([A-Za-z0-9][^\*]+?)\**.*$/i,
  // Labeled picks: "Top pick: Name" or "Top pick - Name"
  /^.*top\s+pick[:\-\s]+\**([A-Za-z0-9].+?)\**\s*$/i,
  // Other labeled recs like "Great alternative: Name"
  /^.*alternative[:\-\s]+\**([A-Za-z0-9].+?)\**\s*$/i,
  // "1) Name - ..." or "1. Name – ..." (dash/en dash)
  /^[\#\*\-\•\d\)\(\s]*\**([A-Za-z0-9][^\-–]+?)\**\s*[–-]\s+/,
  // "1. **Name** - $price ..." (captures name before dash)
  /^[\#\*\-\•\d\s]*\**([A-Za-z0-9][^\-]+?)\**\s+\-/,
  // "1. **Name** ($price ...)" (captures name before parenthesis)
  /^[\#\*\-\•\d\s]*\**([A-Za-z0-9][^\(]+?)\**\s*\(/,
  // "Name:" style lines (heading followed by details)
  /^[\#\*\-\•\d\)\(\s]*\**([A-Za-z0-9][^:]+?)\**\s*:/,
  // Standalone Name: Just the name, optionally bold/italic/numbered, no sentence structure
  // Matches: "**Versace Eros**", "1. **Phantom**", "• **Dior Homme**"
  // Does NOT match: "I recommend Phantom."
  /^[\s\d\.\-\•\*]*([A-Za-z0-9][A-Za-z0-9\s\'\’]+?)[\*\s]*$/
];

const normalize = (str = '') => str.toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const findBestFragrance = (name, brand) => {
  const targetName = normalize(name);
  // If target name is too generic or short, skip it to avoid bad matches
  if (targetName.length < 3) return null;
  // If target name looks like a common word (e.g. "recommended", "perfume"), skip
  const commonWords = ['perfume', 'cologne', 'fragrance', 'scent', 'recommendation', 'option', 'choice'];
  if (commonWords.includes(targetName)) return null;

  const targetBrand = brand ? normalize(brand) : null;

  let best = null;
  let bestScore = 0;

  fragranceData.forEach((f) => {
    const nName = normalize(f.Name || '');
    const nBrand = normalize(f.Brand || '');

    // Skip if no name
    if (!nName) return;

    let score = 0;

    // Brand scoring
    let brandMatch = false;
    if (targetBrand) {
      if (nBrand === targetBrand) {
        score += 5;
        brandMatch = true;
      }
      else if (nBrand.includes(targetBrand) || targetBrand.includes(nBrand)) {
        score += 3;
        brandMatch = true;
      }
    }

    // Name scoring
    // Require name match to be significant
    let nameMatch = false;
    if (nName === targetName) {
      score += 10;
      nameMatch = true;
    } 
    else if (nName.includes(targetName)) {
      // "Phantom" matching "Paco Rabanne Phantom"
      score += 5;
      nameMatch = true;
    }
    else if (targetName.includes(nName)) {
       // "Paco Rabanne Phantom" matching "Phantom"
       // Only if nName is significant length
       if (nName.length > 4) {
         score += 8; // Increased from 3 to handle "1. Name" cases
         nameMatch = true;
       }
    }

    // Token overlap bonus
    const tokens = targetName.split(' ').filter(t => t.length > 2); // ignore short words
    if (tokens.length > 0) {
      const tokenMatches = tokens.filter(t => nName.includes(t)).length;
      const matchRatio = tokenMatches / tokens.length;
      score += matchRatio * 4;
      if (matchRatio > 0.5) nameMatch = true;
    }

    // CRITICAL: We need a NAME match, not just a brand match.
    // If we only matched the brand, this is not our fragrance.
    if (!nameMatch) {
      score = 0;
    }

    if (score > bestScore) {
      bestScore = score;
      best = f;
    }
  });

  // Increased threshold to 6 to be safer
  // This requires at least a partial name match (5) + some token overlap or brand match
  return bestScore >= 4 ? best : null; 
};

// Component for displaying recommended fragrance cards with full profile
const RecommendationCard = ({ fragrance, onAddToWishlist, onViewDetails }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToWishlist = async (e) => {
    // e.stopPropagation() not needed as card is not clickable
    setIsAdding(true);
    await onAddToWishlist(fragrance);
    setIsAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Get image URL - try multiple possible field names
  const imageUrl = fragrance['Image URL'] || fragrance.imageURL || fragrance.image || '';
  const notes = fragrance['General Notes'] || [];
  const accords = fragrance['Main Accords'] || [];
  const seasonRanking = fragrance['Season Ranking'] || [];
  const occasionRanking = fragrance['Occasion Ranking'] || [];
  const topSeason = seasonRanking.length > 0 ? seasonRanking[0].name : null;
  const topOccasion = occasionRanking.length > 0 ? occasionRanking[0].name : null;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 hover:shadow-xl transition-all duration-300 my-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Image Section */}
        <div className="w-full md:w-48 h-48 md:h-auto md:min-w-[192px] rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100">
          {imageUrl && !imageError ? (
            <img 
              src={imageUrl} 
              alt={fragrance.Name || 'Fragrance'} 
              className="w-full h-full object-contain p-4"
              onError={(e) => {
                console.log('Image failed to load:', imageUrl);
                setImageError(true);
              }}
              onLoad={() => {
                setImageError(false);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">{fragrance.Brand}</h2>
            <h3 className="text-2xl font-serif italic text-gray-900 mb-3">{fragrance.Name}</h3>
            
            {/* Badges */}
            <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
              <span className="bg-gray-100 px-3 py-1 rounded-full text-xs">{fragrance.Gender}</span>
              {fragrance.OilType && (
                <span className="bg-gray-100 px-3 py-1 rounded-full text-xs">{fragrance.OilType}</span>
              )}
              {topSeason && (
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs capitalize">
                  {topSeason}
                </span>
              )}
              {topOccasion && (
                <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs capitalize">
                  {topOccasion}
                </span>
              )}
              {fragrance.rating && (
                <span className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-xs">
                  <span className="mr-1">★</span> {fragrance.rating}/5
                </span>
              )}
            </div>

            {/* Notes */}
            {notes.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Notes</p>
                <div className="flex flex-wrap gap-2">
                  {notes.slice(0, 6).map((note, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Accords */}
            {accords.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Accords</p>
                <div className="flex flex-wrap gap-2">
                  {accords.slice(0, 5).map((accord, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {accord}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Longevity</p>
                <p className="font-medium text-gray-900 text-sm">{fragrance.Longevity || "Moderate"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sillage</p>
                <p className="font-medium text-gray-900 text-sm">{fragrance.Sillage || "Moderate"}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-auto">
              <button
                onClick={handleAddToWishlist}
                disabled={isAdding || added}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-1 md:flex-none justify-center flex ${
                  added
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {added ? '✓ Added' : isAdding ? 'Adding...' : '+ Add to Wishlist'}
              </button>
              <button
                onClick={() => onViewDetails(fragrance)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors flex-1 md:flex-none justify-center flex"
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Parse fragrance recommendations from Claude's response
// Now returns full objects with match info for structured rendering
const processMessageContent = (text) => {
  const lines = text.split('\n');
  const sections = [];
  let currentSection = { lines: [], fragrance: null };

  for (const line of lines) {
    const trimmed = line.trim();
    let foundFragrance = null;

    if (trimmed.length >= 3) {
      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) {
          let name = match[1].trim();
          let brand = match[2] ? match[2].trim().replace(/[.,;]$/, '') : null;
          
          foundFragrance = findBestFragrance(name, brand);
          if (foundFragrance) break;
        }
      }
    }

    // If we found a NEW fragrance, start a new section
    if (foundFragrance) {
      // If current section has lines, push it
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      // Start new section with this line and fragrance
      currentSection = { lines: [line], fragrance: foundFragrance };
    } else {
      // Otherwise, just append line to current section
      currentSection.lines.push(line);
    }
  }

  // Push the final section
  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return sections;
};

const ChatContainer = () => {
  const [isLoading, setIsLoading] = useState(false);
  // Use global context for state persistence
  const { 
    chatHistory: conversationHistory, 
    setChatHistory: setConversationHistory,
    chatInitialized: hasInitialized,
    setChatInitialized: setHasInitialized,
    addFragrance 
  } = useFragranceContext();
  const [response, setResponse] = useState('');
  const [error, setError] = useState(null);
  const introAssistantIndex = useRef(null); // track the initial assistant message to suppress cards
  const navigate = useNavigate();

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
    const index = fragranceData.findIndex(f => 
      f.Name === fragrance.Name && f.Brand === fragrance.Brand
    );
    if (index !== -1) {
      navigate(`/fragrance/${index + 1}`);
    }
  };

  const handleInputChange = (value) => {
    // Clear error when user types
    if (error) setError(null);
  };

  const handleInputSubmit = async (value) => {
    // Do not send empty messages
    if (!value.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const messageToSend = value.trim();
      const recommendation = await getFragranceRecommendation(messageToSend, conversationHistory);
      
      // Update conversation history via context
      const newHistory = [
        ...conversationHistory,
        { role: 'user', content: messageToSend },
        { role: 'assistant', content: recommendation }
      ];
      setConversationHistory(newHistory);
      setResponse(recommendation);
    } catch (err) {
      const errorMessage = err.message || 'Failed to get recommendation. Please check your API key and try again.';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setConversationHistory([]);
    setResponse('');
    setError(null);
    setHasInitialized(false);
  };

  // Send initial prompt once, but suppress cards for that first assistant reply
  useEffect(() => {
    if (!hasInitialized && conversationHistory.length === 0) {
      const sendInitialPrompt = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const messageToSend = "Hello, I'd like help finding a cologne.";
          const recommendation = await getFragranceRecommendation(messageToSend, []);
          const newHistory = [
            { role: 'user', content: messageToSend },
            { role: 'assistant', content: recommendation }
          ];
          introAssistantIndex.current = 1; // suppress cards for this assistant message
          setConversationHistory(newHistory);
          setResponse(recommendation);
          setHasInitialized(true);
        } catch (err) {
          const errorMessage = err.message || 'Failed to get recommendation. Please check your API key and try again.';
          setError(errorMessage);
          console.error('Error:', err);
        } finally {
          setIsLoading(false);
        }
      };
      sendInitialPrompt();
    }
  }, [hasInitialized, conversationHistory.length]); // Dependency on context values

  return (
    <div className="flex flex-col items-center justify-center h-full container-padding py-4 sm:py-8">
      <div className="w-full max-w-3xl space-y-4 sm:space-y-8 h-full flex flex-col">
        {/* Welcome Message - only show when no conversation started */}
        {conversationHistory.length === 0 && (
          <div className="text-center space-y-4 sm:space-y-6 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extralight tracking-tight text-gray-900 font-serif italic">
              Fragrance Finder
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-500 font-light max-w-lg mx-auto leading-relaxed px-4">
              A curated journey to discover your signature scent through conversation.
            </p>
          </div>
        )}

        {/* Actions Bar */}
        {conversationHistory.length > 0 && (
          <div className="flex justify-center pb-2 sm:pb-4">
            <button
              onClick={handleNewConversation}
              className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-500 hover:text-gray-900 bg-white/50 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-full transition-all duration-300 shadow-sm hover:shadow touch-target"
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 group-hover:bg-emerald-400 transition-colors" />
              Start New Conversation
            </button>
          </div>
        )}

        {/* Main Chat Interface */}
        <div className="relative group flex-1 h-full flex flex-col">
          {/* Decorative backdrop blur */}
          <div className="absolute -inset-1 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-1000" />

          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1 flex-1 flex flex-col overflow-hidden">
            <div className="bg-white/50 rounded-[1.2rem] sm:rounded-[1.4rem] p-4 sm:p-6 md:p-8 flex-1 flex flex-col overflow-hidden">
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto mb-4 sm:mb-6 pr-1 sm:pr-2 space-y-4 sm:space-y-6">
                {conversationHistory.map((msg, idx) => {
                  let messageContent = null;
                  
                  if (msg.role === 'assistant') {
                    // For assistant messages, split content and interleave cards
                    const sections = processMessageContent(msg.content);
                    const isIntroMessage = introAssistantIndex.current === idx;

                    messageContent = (
                      <div className="space-y-6">
                        {sections.map((section, sIdx) => (
                          <div key={sIdx}>
                            <p className="whitespace-pre-wrap leading-relaxed font-light text-base sm:text-lg text-gray-800">
                              {section.lines.join('\n')}
                            </p>
                            {/* Render card if this section has a fragrance match */}
                            {section.fragrance && (
                              <RecommendationCard 
                                fragrance={section.fragrance} 
                                onAddToWishlist={handleAddToWishlist}
                                onViewDetails={handleViewDetails}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    // User message
                    messageContent = (
                      <p className="whitespace-pre-wrap leading-relaxed font-light text-base sm:text-lg text-gray-800">
                        {msg.content}
                      </p>
                    );
                  }

                  return (
                    <div key={idx} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {msg.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white text-xs font-serif italic">
                          F
                        </div>
                      )}
                      <div className={`max-w-[85%] sm:max-w-[80%] space-y-2 ${msg.role === 'user' ? 'bg-gray-100 rounded-xl sm:rounded-2xl rounded-tr-sm p-3 sm:p-4' : ''}`}>
                        {messageContent}
                      </div>
                      {msg.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                          U
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading State - inside scroll area */}
                {isLoading && (
                  <div className="flex justify-start py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex gap-1 sm:gap-1.5">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 rounded-full animate-bounce" />
                      </div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Thinking</p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="bg-red-50/50 border border-red-100 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400" />
                    <p className="text-red-600 text-xs sm:text-sm">{error}</p>
                  </div>
                )}
              </div>

              {/* Input Area - Fixed at bottom */}
              <div className="relative mt-auto">
                <InputBox 
                  onInputChange={handleInputChange}
                  onInputSubmit={handleInputSubmit}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatContainer;
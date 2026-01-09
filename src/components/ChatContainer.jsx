import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useFragranceContext } from '../context/FragranceContext';
import InputBox from './InputBox';
import { getFragranceRecommendation } from '../services/claudeApi';
import fragranceData from '../../fragrances_filtered.json';

// Shared fragrance matching logic
const patterns = [
  // "1. Name by Brand" or bullet variants
  /^[\d\-\•\*\.]+\s*(.+?)\s+by\s+(.+?)(?:\s|$|,|\.)/i,
  /^(.+?)\s+by\s+(.+?)(?:\s|$|,|\.)/i,
  // Brand-prefixed names like "Dior Sauvage Parfum"
  /^(Dior|Chanel|Gucci|Versace|Yves Saint Laurent|Tom Ford|Creed|Acqua di Parma|Jo Malone|Byredo|Maison Francis Kurkdjian|Frederic Malle|Penhaligons|Floris|Aedes de Venustas|Le Labo|Diptyque|Boucheron|Hermes|Chloe|Lancome|Guerlain|Givenchy|Prada|Calvin Klein|Ralph Lauren|Dolce & Gabbana|Armani|Burberry|Marc Jacobs|Victoria's Secret|Paco Rabanne|Carolina Herrera|Elizabeth Arden|Estee Lauder|Clinique|Shiseido|La Mer|La Prairie|Valentino|Moschino|Ferragamo|Jimmy Choo|Fendi|Loro Piana|Bottega Veneta|Celine|Saint Laurent|YSL|Bulgari|Cartier|Van Cleef & Arpels|Graff|Tiffany & Co|Harry Winston|Chopard)\s+(.+?)(?:\s|$|,|\.|\(|\[)/i,
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

    // Name scoring - more flexible matching for fragrance names
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

    // Enhanced token overlap bonus with fragrance-specific logic
    const tokens = targetName.split(' ').filter(t => t.length > 2); // ignore short words
    if (tokens.length > 0) {
      const tokenMatches = tokens.filter(t => nName.includes(t)).length;
      const matchRatio = tokenMatches / tokens.length;
      score += matchRatio * 4;
      if (matchRatio > 0.5) nameMatch = true;

      // Special handling for fragrance names: if we have key brand words, boost score
      const brandTokens = targetBrand ? targetBrand.split(' ').filter(t => t.length > 2) : [];
      const brandTokenMatches = brandTokens.filter(t => nBrand.includes(t)).length;
      if (brandTokenMatches > 0) {
        score += brandTokenMatches * 3; // Extra points for brand matches
        if (tokenMatches > 0) nameMatch = true; // Brand + some name match is good enough
      }

      // Handle common fragrance naming patterns
      // "Dior Sauvage Parfum" should match "Sauvage Eau de Parfum for men"
      if (targetName.includes('sauvage') && nName.includes('sauvage')) {
        score += 15; // High bonus for Sauvage matches
        nameMatch = true;

        // Extra boost for fragrances that start with "Sauvage" (prioritize main line over variants)
        if (nName.startsWith('sauvage')) {
          score += 5; // Prefer "Sauvage Eau de Parfum" over "Balade Sauvage"
        }
      }

      // Handle fragrance type variations (Parfum, Eau de Parfum, EDT, etc.)
      const normalizeFragranceType = (str) => {
        return str.toLowerCase()
          .replace(/\s*eau\s+de\s+/g, ' ')
          .replace(/\s*edt\s*/g, ' ')
          .replace(/\s*edp\s*/g, ' ')
          .replace(/\s*parfum\s*/g, ' ')
          .replace(/\s*cologne\s*/g, ' ')
          .replace(/\s*for\s+(men|women|unisex)\s*/g, ' ')
          .trim();
      };

      const normalizedTarget = normalizeFragranceType(targetName);
      const normalizedName = normalizeFragranceType(nName);

      // If names match after normalizing fragrance types, give high score
      if (normalizedTarget === normalizedName ||
          normalizedName.includes(normalizedTarget) ||
          normalizedTarget.includes(normalizedName)) {
        score += 12;
        nameMatch = true;
      }
    }

    // CRITICAL: We need a NAME match, not just a brand match.
    // If we only matched the brand, this is not our fragrance.
    if (!nameMatch) {
      score = 0;
    }

    // Only consider this a candidate if it has a reasonable score
    if (score >= 4 && score > bestScore) {
      bestScore = score;
      best = f;
    }
  });

  // Increased threshold to 4 to be safer
  // This requires at least a partial name match + some token overlap or brand match
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
    <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-700/50 shadow-2xl p-4 sm:p-6 hover:border-blue-500/50 transition-all duration-300 my-3 sm:my-4 relative overflow-hidden">
      <div className="absolute -inset-0.5 bg-blue-300 rounded-2xl sm:rounded-3xl opacity-10 blur-sm"></div>
      <div className="relative flex flex-col md:flex-row gap-4 sm:gap-6">
        {/* Image Section */}
        <div className="w-full md:w-40 lg:w-48 h-40 sm:h-48 md:h-auto md:min-w-[160px] lg:min-w-[192px] rounded-xl sm:rounded-2xl bg-gray-900/50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-700/50">
          {imageUrl && !imageError ? (
            <img 
              src={imageUrl} 
              alt={fragrance.Name || 'Fragrance'} 
              className="w-full h-full object-contain p-3 sm:p-4"
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5 sm:mb-1">{fragrance.Brand}</h2>
            <h3 className="text-xl sm:text-2xl font-serif italic text-white mb-2 sm:mb-3 leading-tight">{fragrance.Name}</h3>
            
            {/* Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs mb-3 sm:mb-4 flex-wrap">
              <span className="bg-gray-700/50 border border-gray-600/50 text-gray-300 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">{fragrance.Gender}</span>
              {fragrance.OilType && (
                <span className="bg-gray-700/50 border border-gray-600/50 text-gray-300 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">{fragrance.OilType}</span>
              )}
              {topSeason && (
                <span className="bg-blue-500/20 border border-blue-500/50 text-blue-300 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full capitalize">
                  {topSeason}
                </span>
              )}
              {topOccasion && (
                <span className="bg-purple-500/20 border border-purple-500/50 text-purple-300 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full capitalize">
                  {topOccasion}
                </span>
              )}
              {fragrance.rating && (
                <span className="flex items-center text-yellow-400 bg-yellow-500/20 border border-yellow-500/50 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                  <span className="mr-1">★</span> {fragrance.rating}
                </span>
              )}
            </div>

            {/* Notes */}
            {notes.length > 0 && (
              <div className="mb-3 sm:mb-4">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Notes</p>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {notes.slice(0, 4).map((note, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-gray-700/50 text-gray-300 border border-gray-600/50">
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-700/50">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Longevity</p>
                <p className="font-medium text-white text-xs sm:text-sm">{fragrance.Longevity || "Moderate"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Sillage</p>
                <p className="font-medium text-white text-xs sm:text-sm">{fragrance.Sillage || "Moderate"}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-auto">
              <button
                onClick={handleAddToWishlist}
                disabled={isAdding || added}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-medium rounded-lg transition-colors flex-1 md:flex-none justify-center flex backdrop-blur-sm ${
                  added
                    ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600/50'
                }`}
              >
                {added ? '✓ Added' : isAdding ? 'Adding...' : '+ Wishlist'}
              </button>
              <button
                onClick={() => onViewDetails(fragrance)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-medium rounded-lg bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 text-white transition-colors flex-1 md:flex-none justify-center flex backdrop-blur-sm"
              >
                View Details
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
      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const match = trimmed.match(pattern);
        if (match) {
          let name = match[1].trim();
          let brand = match[2] ? match[2].trim().replace(/[.,;]$/, '') : null;

          // Special handling for brand-prefixed patterns (index 2)
          if (i === 2 && match[2]) {
            brand = match[1].trim();
            name = match[2].trim();
          }

          foundFragrance = findBestFragrance(name, brand);
          if (foundFragrance) {
            break;
          }
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
    // Find the index of the fragrance in the data array
    const fragranceIndex = fragranceData.findIndex(f => f === fragrance);
    if (fragranceIndex !== -1) {
      // Navigate to fragrance details page (1-based index)
      navigate(`/fragrance/${fragranceIndex + 1}`);
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
    <div className="flex flex-col items-center justify-center h-full px-2 sm:px-4 py-2 sm:py-8">
      <div className="w-full max-w-3xl space-y-3 sm:space-y-8 h-full flex flex-col">
        {/* Welcome Message - always visible */}
        <div className={`text-center space-y-2 sm:space-y-6 ${conversationHistory.length === 0 ? 'animate-fade-in' : ''}`}>
          <h1 className={`font-extralight tracking-tight text-white font-serif italic transition-all duration-300 ${
            conversationHistory.length === 0 
              ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl' 
              : 'text-xl sm:text-2xl md:text-3xl'
          }`}>
            Fragrance Finder
          </h1>
          {conversationHistory.length === 0 && (
            <p className="text-xs sm:text-base md:text-lg lg:text-xl text-gray-400 font-light max-w-lg mx-auto leading-relaxed px-4">
              A curated journey to discover your signature scent through conversation.
            </p>
          )}
        </div>
        
        {/* Actions Bar */}
        {conversationHistory.length > 0 && (
          <div className="flex justify-center pb-1 sm:pb-4">
            <button
              onClick={handleNewConversation}
              className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-[10px] sm:text-sm text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-800/80 border border-gray-700/50 hover:border-gray-600/50 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm"
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-500 group-hover:bg-emerald-400 transition-colors" />
              <span className="hidden sm:inline">Start New Conversation</span>
              <span className="sm:hidden">New Chat</span>
            </button>
          </div>
        )}

        {/* Main Chat Interface */}
        <div className="relative group flex-1 h-full flex flex-col min-h-0">
          {/* Decorative backdrop blur */}
          <div className="absolute -inset-1 bg-blue-300/20 rounded-2xl sm:rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-1000" />
          
          <div className="relative bg-gray-800/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-700/50 shadow-2xl p-0.5 sm:p-1 flex-1 flex flex-col overflow-hidden">
            <div className="bg-gray-900/30 rounded-[1rem] sm:rounded-[1.4rem] p-2 sm:p-4 md:p-6 lg:p-8 flex-1 flex flex-col overflow-hidden">
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto mb-2 sm:mb-4 md:mb-6 pr-1 sm:pr-2 space-y-3 sm:space-y-4 md:space-y-6 scroll-smooth">
                {conversationHistory.map((msg, idx) => {
                  let messageContent = null;
                  
                  if (msg.role === 'assistant') {
                    // For assistant messages, split content and interleave cards
                    const sections = processMessageContent(msg.content);
                    const isIntroMessage = introAssistantIndex.current === idx;

                    messageContent = (
                      <div className="space-y-4 sm:space-y-6">
                        {sections.map((section, sIdx) => (
                          <div key={sIdx}>
                            <div className="claude-message">
                              <ReactMarkdown
                                components={{
                                  p: ({node, ...props}) => <p className="mb-2 sm:mb-3 md:mb-4 text-xs sm:text-base" {...props} />,
                                  strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                                  em: ({node, ...props}) => <em className="italic" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 sm:mb-3 md:mb-4 space-y-1 sm:space-y-2 ml-1 sm:ml-4 text-xs sm:text-base" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 sm:mb-3 md:mb-4 space-y-1 sm:space-y-2 ml-1 sm:ml-4 text-xs sm:text-base" {...props} />,
                                  li: ({node, ...props}) => <li className="ml-0.5 sm:ml-2" {...props} />,
                                  code: ({node, inline, ...props}) => 
                                    inline 
                                      ? <code className="bg-gray-900 px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-sm font-mono text-pink-300" {...props} />
                                      : <code className="block bg-gray-900 p-1.5 sm:p-3 rounded-lg text-[10px] sm:text-sm font-mono text-pink-300 overflow-x-auto my-1 sm:my-2" {...props} />,
                                  pre: ({node, ...props}) => <pre className="bg-gray-900 p-1.5 sm:p-3 rounded-lg overflow-x-auto my-1 sm:my-2 text-[10px] sm:text-sm" {...props} />,
                                  h1: ({node, ...props}) => <h1 className="text-lg sm:text-2xl font-semibold text-white mt-3 sm:mt-6 mb-1 sm:mb-3" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-base sm:text-xl font-semibold text-white mt-2 sm:mt-5 mb-1 sm:mb-2" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-sm sm:text-lg font-semibold text-white mt-2 sm:mt-4 mb-1 sm:mb-2" {...props} />,
                                }}
                              >
                                {section.lines.join('\n')}
                              </ReactMarkdown>
                            </div>
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
                      <p className="user-message whitespace-pre-wrap text-xs sm:text-base break-words">
                        {msg.content}
                      </p>
                    );
                  }

                  return (
                    <div key={idx} className={`flex items-start gap-1.5 sm:gap-3 md:gap-4 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`} style={{ animationDelay: `${idx * 100}ms` }}>
                      {msg.role === 'assistant' && (
                        <div className="flex-shrink-0 w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-[10px] sm:text-sm font-bold shadow-lg border border-orange-300/50">
                          C
                        </div>
                      )}
                      <div className={`max-w-[90%] sm:max-w-[80%] space-y-1 ${msg.role === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl rounded-tr-sm p-2.5 sm:p-4 md:p-5 shadow-xl border border-blue-400/50 text-xs sm:text-base' 
                        : 'bg-gray-800/60 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-2.5 sm:p-4 md:p-6 border border-gray-700/50 text-xs sm:text-base'}`}>
                        {messageContent}
                      </div>
                      {msg.role === 'user' && (
                        <div className="flex-shrink-0 w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-[10px] sm:text-sm font-bold shadow-lg border border-blue-300/50">
                          U
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading State - inside scroll area */}
                {isLoading && (
                  <div className="flex justify-start py-2 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" />
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Thinking</p>
                    </div>
                  </div>
                )}
                
                {/* Error State */}
                {error && (
                  <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <p className="text-red-300 text-xs sm:text-sm">{error}</p>
                  </div>
                )}
              </div>

              {/* Input Area - Fixed at bottom */}
              <div className="relative mt-auto pt-2">
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

// Export utility functions for use in other components
export { processMessageContent, RecommendationCard };

export default ChatContainer;
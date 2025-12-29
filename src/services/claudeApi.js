import Anthropic from '@anthropic-ai/sdk';
import fragranceData from '../../fragrances_filtered.json';

// Initialize Anthropic client only when API key is available
const getAnthropicClient = () => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('API Key check:', {
      envVar: import.meta.env.VITE_ANTHROPIC_API_KEY,
      allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes('ANTHROPIC'))
    });
    throw new Error('VITE_ANTHROPIC_API_KEY is not set in environment variables. Make sure the .env file exists and restart the dev server.');
  }
  // Verify API key format
  if (!apiKey.startsWith('sk-ant-')) {
    throw new Error('Invalid API key format. API key should start with "sk-ant-"');
  }
  // WARNING: dangerouslyAllowBrowser exposes your API key in the browser
  // This is only for development. For production, use a backend proxy.
  return new Anthropic({ 
    apiKey,
    dangerouslyAllowBrowser: true 
  });
};

// Tool definition for searching fragrances
const searchFragrancesTool = {
  name: 'search_fragrances',
  description: 'Search for fragrances based on criteria like accords, notes, gender, season, occasion, price range, or keywords. Excludes fragrances already owned or wishlisted. Returns matching fragrances with their details.',
  input_schema: {
    type: 'object',
    properties: {
      accords: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of accords to search for (e.g., ["woody", "spicy", "citrus", "vanilla"])'
      },
      notes: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of notes to search for (e.g., ["vanilla", "sandalwood", "pepper"])'
      },
      gender: {
        type: 'string',
        enum: ['men', 'women', 'unisex'],
        description: 'Filter by gender preference'
      },
      season: {
        type: 'string',
        enum: ['spring', 'summer', 'fall', 'winter'],
        description: 'Filter by best season to wear'
      },
      occasion: {
        type: 'string',
        description: 'Filter by occasion (e.g., "casual", "professional", "night out", "date")'
      },
      priceMax: {
        type: 'number',
        description: 'Maximum price in USD'
      },
      priceMin: {
        type: 'number',
        description: 'Minimum price in USD'
      },
      minRating: {
        type: 'number',
        description: 'Minimum rating (0-5)'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (default: 20, max: 50)'
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'Keywords to search in fragrance name or brand (e.g., ["creed", "dior"])'
      }
    }
  }
};

// Tool handler: Search and filter fragrances
const handleSearchFragrances = (args) => {
  let results = [...fragranceData];
  const limit = Math.min(args.maxResults || 20, 50); // Cap at 50

  // Create set of fragrances to exclude (by name-brand combination)
  const excludeSet = new Set(
    currentExcludeFragrances.map(f => `${(f.Name || f.name || '').toLowerCase()}-${(f.Brand || f.brand || '').toLowerCase()}`)
  );

  // Filter out owned/wishlisted fragrances
  results = results.filter(f => {
    const key = `${(f.Name || '').toLowerCase()}-${(f.Brand || '').toLowerCase()}`;
    return !excludeSet.has(key);
  });

// Filter by gender
if (args.gender) {
  results = results.filter(f => {
    const gender = (f.Gender || '').toLowerCase().trim();
    const searchGender = args.gender.toLowerCase();

    // Exact match or unisex fragrances (unisex can match any gender)
    return gender === searchGender || gender === 'unisex';
  });
}

  // Filter by price
  if (args.priceMin !== undefined || args.priceMax !== undefined) {
    results = results.filter(f => {
      const price = parseFloat(f.Price) || 0;
      if (args.priceMin !== undefined && price < args.priceMin) return false;
      if (args.priceMax !== undefined && price > args.priceMax) return false;
      return true;
    });
  }

  // Filter by rating
  if (args.minRating !== undefined) {
    results = results.filter(f => {
      const rating = parseFloat(f.rating) || 0;
      return rating >= args.minRating;
    });
  }

  // Filter by keywords (name or brand)
  if (args.keywords && args.keywords.length > 0) {
    results = results.filter(f => {
      const name = (f.Name || '').toLowerCase();
      const brand = (f.Brand || '').toLowerCase();
      return args.keywords.some(keyword => 
        name.includes(keyword.toLowerCase()) || 
        brand.includes(keyword.toLowerCase())
      );
    });
  }

  // Score and rank by relevance
  const scored = results.map(fragrance => {
    let score = 0;
    const accords = (fragrance['Main Accords'] || []).map(a => a.toLowerCase());
    const notes = (fragrance['General Notes'] || []).map(n => n.toLowerCase());
    const seasonRanking = fragrance['Season Ranking'] || [];
    const occasionRanking = fragrance['Occasion Ranking'] || [];

    // Score accords (higher weight)
    if (args.accords && args.accords.length > 0) {
      args.accords.forEach(accord => {
        const accordLower = accord.toLowerCase();
        if (accords.some(a => a.includes(accordLower))) {
          score += 3;
        }
      });
    }

    // Score notes
    if (args.notes && args.notes.length > 0) {
      args.notes.forEach(note => {
        const noteLower = note.toLowerCase();
        if (notes.some(n => n.includes(noteLower))) {
          score += 2;
        }
      });
    }

    // Score season (weighted by ranking)
    if (args.season) {
      const seasonMatch = seasonRanking.find(s => 
        s.name.toLowerCase() === args.season.toLowerCase()
      );
      if (seasonMatch) {
        score += seasonMatch.score * 2;
      }
    }

    // Score occasion (weighted by ranking)
    if (args.occasion) {
      const occasionMatch = occasionRanking.find(o => 
        o.name.toLowerCase().includes(args.occasion.toLowerCase())
      );
      if (occasionMatch) {
        score += occasionMatch.score * 2;
      }
    }

    // Boost by rating (prefer higher rated)
    const rating = parseFloat(fragrance.rating) || 0;
    score += rating * 0.5;

    return { fragrance, score };
  });

  // Sort by score and format results
  const topResults = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => ({
      Name: item.fragrance.Name,
      Brand: item.fragrance.Brand,
      Gender: item.fragrance.Gender,
      Rating: item.fragrance.rating,
      Price: item.fragrance.Price || 'N/A',
      OilType: item.fragrance.OilType,
      Longevity: item.fragrance.Longevity,
      Sillage: item.fragrance.Sillage,
      Accords: item.fragrance['Main Accords'] || [],
      Notes: item.fragrance['General Notes'] || [],
      SeasonRanking: item.fragrance['Season Ranking'] || [],
      OccasionRanking: item.fragrance['Occasion Ranking'] || [],
      ImageURL: item.fragrance['Image URL'],
    }));

  return {
    count: topResults.length,
    fragrances: topResults
  };
};

// Store exclusion fragrances globally for the tool handler
let currentExcludeFragrances = [];

export const prepareSwipeData = (swipeHistory) => {
  // Takes array of swipe actions: [{ fragrance: {...}, action: 'love'/'like'/'meh'/'skip' }, ...]
  // Returns: { loved: [], liked: [], meh: [] }
  // Filter and separate fragrances by action type
  // Skip actions should be excluded from all arrays

  const result = {
    loved: [],
    liked: [],
    meh: []
  };

  swipeHistory.forEach(item => {
    if (item.action === 'love') {
      result.loved.push(item.fragrance);
    } else if (item.action === 'like') {
      result.liked.push(item.fragrance);
    } else if (item.action === 'meh') {
      result.meh.push(item.fragrance);
    }
    // Skip 'skip' actions - they are not included in any array
  });

  return result;
};

export const getSwipeBasedRecommendations = async (swipeData, userGender = null) => {
  try {
    // Check if API key is available
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('API key is not set. Please check your .env file and restart the dev server.');
    }

    const anthropic = getAnthropicClient();

    // Set currentExcludeFragrances to all swiped fragrances
    currentExcludeFragrances = [...swipeData.loved, ...swipeData.liked, ...swipeData.meh];

    // Analyze gender from swipe data
    const allSwipedFragrances = [...swipeData.loved, ...swipeData.liked, ...swipeData.meh];
    const genderCounts = {};

    allSwipedFragrances.forEach(f => {
      const gender = (f.Gender || f.gender || '').toLowerCase().trim();
      if (gender) {
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
      }
    });

    // Find dominant gender
    let dominantGender = userGender || 'unisex';
    if (Object.keys(genderCounts).length > 0) {
      const sortedGenders = Object.entries(genderCounts).sort((a, b) => b[1] - a[1]);
      dominantGender = sortedGenders[0][0];
    }

    // Build fragrance lists with proper field mapping
    const formatFragrance = (f) => ({
      name: f.Name || f.name || '',
      brand: f.Brand || f.brand || '',
      gender: f.Gender || f.gender || '',
      notes: f['General Notes'] || f.notes || [],
      accords: f['Main Accords'] || f.accords || [],
      rating: f.rating || f.Rating || 0,
      price: f.Price || f.price || 0
    });

    const lovedFragrances = swipeData.loved.map(formatFragrance);
    const likedFragrances = swipeData.liked.map(formatFragrance);
    const mehFragrances = swipeData.meh.map(formatFragrance);

    const systemPrompt = `You are analyzing a user's fragrance preferences based on their swipe actions.

LOVED Fragrances (Highest Priority - Weight: +2):
${JSON.stringify(lovedFragrances, null, 2)}

LIKED Fragrances (Medium Priority - Weight: +1):
${JSON.stringify(likedFragrances, null, 2)}

MEH Fragrances (Avoid These Characteristics - Weight: -1):
${JSON.stringify(mehFragrances, null, 2)}

Gender Preference: ${dominantGender}

CRITICAL INSTRUCTIONS:
1. You MUST use search_fragrances tool with gender parameter set to "${dominantGender}"
2. Do NOT recommend fragrances the user has already seen
3. Prioritize characteristics from LOVED fragrances most heavily
4. Consider characteristics from LIKED fragrances secondarily
5. AVOID characteristics that appear in MEH fragrances
6. If no loved/liked fragrances, focus on popular highly-rated ${dominantGender} fragrances

Your task:
1. Identify common accords/notes in LOVED and LIKED fragrances
2. Identify accords/notes to AVOID from MEH fragrances
3. Use search_fragrances to find 10 new fragrances matching preferred profile
4. Rank by how well they match user's preferences

Format response as:
[2-3 sentences explaining preference patterns]

Based on your preferences, here are fragrances you'll love:

**1. [Exact Name] by [Exact Brand]** - [Why this matches]
**2. [Exact Name] by [Exact Brand]** - [Why this matches]
...through 10`;

    const messages = [{
      role: 'user',
      content: 'Analyze my swipe preferences and recommend fragrances based on my loved and liked fragrances.'
    }];

    // First API call - Claude may request tools
    let response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      tools: [searchFragrancesTool],
      system: systemPrompt,
      messages: messages
    });

    // Handle tool calls in a loop
    while (response.stop_reason === 'tool_use') {
      const toolCalls = response.content.filter(item => item.type === 'tool_use');

      // Process each tool call
      const toolResults = toolCalls.map(toolCall => {
        if (toolCall.name === 'search_fragrances') {
          try {
            const results = handleSearchFragrances(toolCall.input);
            return {
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: JSON.stringify(results, null, 2)
            };
          } catch (error) {
            return {
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: JSON.stringify({ error: error.message })
            };
          }
        }
        return null;
      }).filter(Boolean);

      // Add assistant's tool use to messages
      messages.push({
        role: 'assistant',
        content: response.content
      });

      // Add tool results to messages
      messages.push({
        role: 'user',
        content: toolResults
      });

      // Get Claude's response with tool results
      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        tools: [searchFragrancesTool],
        system: systemPrompt,
        messages: messages
      });
    }

    // Extract final response text
    if (response.content && response.content.length > 0) {
      const textContent = response.content.find(item => item.type === 'text');
      if (textContent) {
        const fullResponse = textContent.text;

        // Split on "based on your preferences" pattern
        const splitPattern = /based on your preferences/i;
        const parts = fullResponse.split(splitPattern);

        if (parts.length >= 2) {
          return {
            analysis: parts[0].trim(),
            recommendations: 'Based on your preferences' + parts[1].trim()
          };
        } else {
          // Fallback if pattern not found
          return {
            analysis: 'Based on your swipe preferences...',
            recommendations: fullResponse
          };
        }
      }
      // Fallback if no text content
      return {
        analysis: 'Based on your swipe preferences...',
        recommendations: response.content[0].text || 'I apologize, but I encountered an issue processing your request.'
      };
    }

    throw new Error('No response content received');

  } catch (error) {
    console.error('Error calling Claude API for swipe recommendations:', error);

    // Provide more specific error messages
    if (error.message?.includes('API key')) {
      throw new Error('API key error: ' + error.message);
    } else if (error.status === 401) {
      throw new Error('Invalid API key. Please check your API key in the .env file.');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.message) {
      throw new Error('API Error: ' + error.message);
    } else {
      throw new Error('Failed to connect to Claude API. Please check your internet connection and API key.');
    }
  } finally {
    // Clear currentExcludeFragrances
    currentExcludeFragrances = [];
  }
};

export const generateScentProfileDescription = async (collectionFragrances, wishlistFragrances) => {

  try {
    console.log('Starting scent profile generation...');

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('API key not found!');
      throw new Error('API key is not set. Please check your .env file and restart the dev server.');
    }

    console.log('API key found, proceeding with Claude API call');

    const anthropic = getAnthropicClient();

    // Set the fragrances to exclude (owned + wishlisted)
    currentExcludeFragrances = [...collectionFragrances, ...wishlistFragrances];

    const allFragrances = [...collectionFragrances, ...wishlistFragrances];

    console.log('Collection fragrances:', collectionFragrances);
    console.log('Wishlist fragrances:', wishlistFragrances);
    console.log('Total fragrances to exclude:', currentExcludeFragrances.length);
    console.log('Total fragrances:', allFragrances.length);

    if (allFragrances.length === 0) {

      return {

        personality: "You haven't added any fragrances yet. Add some to discover your scent personality!",

        recommendations: ""

      };

    }



    const fragranceData = allFragrances.map(f => {
      // Get gender from full fragrance data if available
      const fullFragrance = f.fragranceData || f;
      const gender = (fullFragrance.Gender || fullFragrance.gender || 'unisex').toLowerCase();

      return {
        name: f.Name || f.name,
        brand: f.Brand || f.brand,
        gender: gender,
        accords: f.accords || f['Main Accords'] || [],
        notes: f.notes || f['General Notes'] || []
      };
    });

    // Analyze gender distribution in user's collection
    const genderStats = fragranceData.reduce((acc, f) => {
      const gender = f.gender && f.gender !== '' ? f.gender : 'unisex';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    const dominantGender = Object.entries(genderStats).reduce((a, b) =>
      genderStats[a[0]] > genderStats[b[0]] ? a : b
    )[0];

    console.log('Gender analysis:', { genderStats, dominantGender, totalFragrances: fragranceData.length });

    const prompt = `Analyze these fragrances from the user's collection:

${JSON.stringify(fragranceData, null, 2)}

Gender Analysis: The user primarily owns ${dominantGender} fragrances (${genderStats[dominantGender]} out of ${fragranceData.length} fragrances).

IMPORTANT: Do NOT recommend any fragrances that are already in the user's collection or wishlist. The search_fragrances tool will automatically exclude these fragrances.

CRITICAL: You MUST use the gender parameter set to "${dominantGender}" when calling search_fragrances. Only recommend fragrances that match this gender category. Do not recommend women's fragrances if the user owns men's fragrances, and vice versa.

Respond in this EXACT format:



First, write 2-3 direct sentences about their scent preferences.

Then write "Recommendations:" on a new line.

Then list exactly 5 fragrances from the search results:
**1. [Exact Name from search] by [Exact Brand from search]**
**2. [Exact Name from search] by [Exact Brand from search]**
(etc)

Only use fragrances that were returned by search_fragrances. Do not add any fragrances from your general knowledge.`;




    console.log('Fragrance data prepared for Claude API call');

    let messages = [{ role: 'user', content: prompt }];

    console.log('Making API call with prompt:', prompt);

    let response = await anthropic.messages.create({

      model: 'claude-haiku-4-5-20251001',

      max_tokens: 2048,

      tools: [searchFragrancesTool],

      messages: messages

    });

    console.log('API response received:', response);



    // Handle tool calls

    while (response.stop_reason === 'tool_use') {

      const toolCalls = response.content.filter(item => item.type === 'tool_use');



      const toolResults = toolCalls.map(toolCall => {

        if (toolCall.name === 'search_fragrances') {

          try {

            const results = handleSearchFragrances(toolCall.input);

            return {

              type: 'tool_result',

              tool_use_id: toolCall.id,

              content: JSON.stringify(results, null, 2)

            };

          } catch (error) {

            return {

              type: 'tool_result',

              tool_use_id: toolCall.id,

              content: JSON.stringify({ error: error.message })

            };

          }

        }

        return null;

      }).filter(Boolean);



      messages.push({ role: 'assistant', content: response.content });

      messages.push({ role: 'user', content: toolResults });



      response = await anthropic.messages.create({

        model: 'claude-haiku-4-5-20251001',

        max_tokens: 2048,

        tools: [searchFragrancesTool],

        messages: messages

      });

    }



    const textContent = response.content.find(item => item.type === 'text');

    const fullText = textContent ? textContent.text : '';



    console.log('Full Claude response:', fullText); // Debug log



    // Split personality and recommendations more reliably

    // Look for "Recommendations" or numbered list pattern

    let personality = '';

    let recommendations = '';



    // Try to find where recommendations start

    const recStartPatterns = [

      /(?:##?\s*)?recommendations?:?\s*$/im,

      /(?:here are|based on your)/i,

      /^\s*(?:\*\*)?(?:1\.|\d+\.)(?:\s|\*\*)/m

    ];



    let splitIndex = -1;

    for (const pattern of recStartPatterns) {

      const match = fullText.search(pattern);

      if (match !== -1) {

        splitIndex = match;

        break;

      }

    }



    if (splitIndex !== -1) {

      // Split at the found index

      personality = fullText.substring(0, splitIndex).trim();

      recommendations = fullText.substring(splitIndex).trim();



      // Clean up personality - remove any "Recommendations" header if it snuck in

      personality = personality.replace(/(?:##?\s*)?recommendations?:?\s*$/im, '').trim();



      // Clean up recommendations - remove standalone "Recommendations:" header

      recommendations = recommendations.replace(/^(?:##?\s*)?recommendations?:?\s*/im, '').trim();

    } else {

      // No clear split found - treat everything as personality

      personality = fullText.trim();

      recommendations = '';

    }



    console.log('Split result:', { personality, recommendations }); // Debug log



    return {

      personality: personality || 'Your collection shows sophisticated taste in fragrances.',

      recommendations: recommendations

    };



  } catch (error) {

    console.error('Error generating scent profile description:', error);

    return {

      personality: "Your collection shows sophisticated taste in fragrances.",

      recommendations: ""

    };

  } finally {

    // Clear the exclusion list after processing

    currentExcludeFragrances = [];

  }

};

export const getFragranceRecommendation = async (userInput, conversationHistory = []) => {
  try {
    // Check if API key is available
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('API key is not set. Please check your .env file and restart the dev server.');
    }

    const anthropic = getAnthropicClient();
    
    // Build messages array with conversation history
    const messages = [...conversationHistory, {
      role: 'user',
      content: userInput
    }];

    // First API call - Claude may request tools
    let response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      tools: [searchFragrancesTool],
      system: `You are a cologne savant tasked with helping users find a cologne that's well suited for them.

You have access to a fragrance database through the search_fragrances tool. Use this tool to find relevant fragrances when:
- The user asks for recommendations
- The user describes what they're looking for
- The user mentions preferences (accords, notes, season, occasion, gender, price)
- You need to provide specific fragrance suggestions

IMPORTANT: Only recommend fragrances that exist in the database. Always use the search_fragrances tool to find fragrances before recommending them. When recommending, use the exact Name and Brand from the search results.

You will first ask the user if they know what cologne they are looking for or not.

There are 2 scenarios that will be presented:

## User doesn't know what type of cologne they're looking for

When a user doesn't know what they're looking for, your job is to figure out what type of scents they would like. You will then create a scent profile of the user and use that to recommend colognes from the database. Probe the user with binary questions (ask one question at a time) to narrow down the different scents that the user is interested in. It shouldn't feel like a quiz but more like a conversation. Keep in mind that a person who doesn't know what they're looking for will typically be less knowledgeable about cologne, so make sure questions are easy to understand such as "do you like the smell of ice cream?" or "are you interested in something spicy?". Ask for the weather question first and keep it simple: colder weather, hotter weather, or year round. When describing things like warm and cozy scents, try and give a real world picture of the scents. Don't describe elements like sweet or earthy with other notes - try and use examples so users can picture what that means.

Once you understand their preferences, use the search_fragrances tool to find matching fragrances.

## User knows what type of cologne they're looking for

When a user knows what type of scent they're looking for, your job is to take the description given by the user and use the search_fragrances tool to find matching fragrances. Provide 10 cologne suggestions from the search results, each with a brief description. You will then ask the user if they are interested in any of the recommendations. If they are interested, ask if they want a more detailed description. If they are not interested, then search again with different criteria and provide 10 more suggestions. Continue this process until the user is interested with one of the suggestions. When a user knows what type of scent they're looking for, try not to ask too many follow up questions.

## Knowledge

When describing fragrances, use the notes, longevity, sillage, price, ratings, and season information from the search results to paint a picture of what a cologne smells like. When giving recommendations, try and describe scents within the context of the real world instead of just listing notes.`,
      messages: messages
    });

    // Handle tool calls in a loop
    while (response.stop_reason === 'tool_use') {
      const toolCalls = response.content.filter(item => item.type === 'tool_use');
      
      // Process each tool call
      const toolResults = toolCalls.map(toolCall => {
        if (toolCall.name === 'search_fragrances') {
          try {
            const results = handleSearchFragrances(toolCall.input);
            return {
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: JSON.stringify(results, null, 2)
            };
          } catch (error) {
            return {
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: JSON.stringify({ error: error.message })
            };
          }
        }
        return null;
      }).filter(Boolean);

      // Add assistant's tool use to messages
      messages.push({
        role: 'assistant',
        content: response.content
      });
      
      // Add tool results to messages
      messages.push({
        role: 'user',
        content: toolResults
      });

      // Get Claude's response with tool results
      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        tools: [searchFragrancesTool],
        messages: messages
      });
    }

    // Extract final response text
    if (response.content && response.content.length > 0) {
      const textContent = response.content.find(item => item.type === 'text');
      if (textContent) {
        return textContent.text;
      }
      // Fallback if no text content
      return response.content[0].text || 'I apologize, but I encountered an issue processing your request.';
    }
    
    throw new Error('No response content received');
  } catch (error) {
    console.error('Error calling Claude API:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('API key')) {
      throw new Error('API key error: ' + error.message);
    } else if (error.status === 401) {
      throw new Error('Invalid API key. Please check your API key in the .env file.');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.message) {
      throw new Error('API Error: ' + error.message);
    } else {
      throw new Error('Failed to connect to Claude API. Please check your internet connection and API key.');
    }
  }
};
